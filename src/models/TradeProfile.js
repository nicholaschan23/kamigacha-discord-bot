const CardModel = require("../database/mongodb/models/card/card");
const CollectionModel = require("../database/mongodb/models/card/collection");
const InventoryModel = require("../database/mongodb/models/user/inventory");
const { isValidCode } = require("../utils/string/validation");
const config = require("../config");

class TradeProfile {
  constructor(user) {
    this.user = user;

    // Trade offer
    this.offerInput = [];
    this.validCards = new Set(); // { card code }
    this.validItems = new Map(); // { item name: quantity }

    // Initialized by fetchDocuments()
    this.cardCollection;
    this.itemInventory;
  }

  async fetchDocuments() {
    // Populate user's card collection and inventory in parallel
    const [collection, inventory] = await Promise.all([
      CollectionModel()
        .findOneAndUpdate(
          {
            userId: this.user.id,
          },
          { $setOnInsert: { userId: this.user.id } },
          { new: true, upsert: true }
        )
        .populate("cardsOwned"),
      InventoryModel().findOneAndUpdate(
        {
          userId: this.user.id,
        },
        { $setOnInsert: { userId: this.user.id } },
        { new: true, upsert: true }
      ),
    ]);
    this.cardCollection = collection.cardsOwned;
    this.itemInventory = inventory.inventory;
  }

  // await modal.followUp({ content: "Trade offer submitted!", components: [] });
  async processOffer(modal) {
    // Save the offer input as an array
    this.offerInput = modal.fields
      .getTextInputValue("offerInput")
      .split(",")
      .map((item) => item.trim());

    // Output errors for player feedback
    const errorCards = new Set();
    const errorItems = new Map();

    /**
     * If the token has no spaces, it's a card code.
     * Else, split the token by spaces and check if the first token is a number.
     * If the first token is a number, it's a quantity followed by an item.
     * If the first token is not a number, it's default a quantity of 1.
     */
    this.validCards = new Set();
    this.validItems = new Map();
    for (const token of this.offerInput) {
      const tokenArray = token.split(" ");

      if (tokenArray.length === 1) {
        const code = tokenArray[0];

        // Check if code is valid
        if (!isValidCode(code)) {
          errorCards.add(code);
          continue;
        }

        // Check if card is owned by player
        const cardOwned = this.cardCollection.some((card) => card.code === code);
        if (!cardOwned) {
          errorCards.add(code);
          continue;
        }

        // Add the offer to the trade
        this.validCards.add(code);
      } else {
        let quantity = tokenArray[0];
        let itemName;

        // Parse quantity and item name
        if (isNaN(quantity)) {
          quantity = 1; // Default quantity
          itemName = tokenArray.join(" ");
        } else {
          quantity = Math.abs(parseInt(quantity));
          itemName = tokenArray.slice(1).join(" ");
        }

        // Check if item exists
        const itemExists = config.itemsMap.has(itemName);
        if (!itemExists) {
          errorItems.set(itemName, errorItems.get(itemName) || 0 + quantity);
          continue;
        }

        // Check if player has the item and available quantity
        const hasItem = this.itemInventory.some((item) => item.name === itemName && item.quantity >= quantity);
        if (!hasItem) {
          errorItems.set(itemName, errorItems.get(itemName) || 0 + quantity);
          continue;
        }

        // Add the offer to the trade
        this.validItems.set(itemName, this.validItems.get(itemName) || 0 + quantity);
      }
    }

    // Check for errors and send feedback
    if (errorCards.size > 0 || errorItems.size > 0) {
      const cards = Array.from(errorCards);
      const items = Array.from(errorItems.entries()).map(([key, value]) => `${value} ${key}`);
      const content = 
        `❌ Invalid code or insufficient balance: ${[
          cards.map((code) => `\`${code}\``).join(", "),
          items.map((item) => `\`${item}\``).join(", "),
        ].filter(Boolean).join(", ")}`
      ;
      await modal.reply({ content: content, ephemeral: true });
    } else {
      await modal.reply({ content: "✅ Trade offer submitted successfully!", ephemeral: true });
    }
  }

  /**
   * Assembles an offer string from the valid cards (code) and items (quantity item) separated by commas.
   * @returns {String} The assembled string.
   */
  get offer() {
    const cards = Array.from(this.validCards);
    const items = Array.from(this.validItems.entries()).map(([key, value]) => `${value} ${key}`);
    const offer = [];
    if (cards.length > 0) offerParts.push(cards.join(", "));
    if (items.length > 0) offerParts.push(items.join(", "));
    if (offer.length === 0) return "No offer yet";
    return offer.join(", ");
  }

  // async verifyOffer() {
  //   // Check if the user has the cards and items in their collection and inventory
  //   for (const card of this.validCards) {
  //     if (!this.cardCollection.has(card)) return false;
  //   }
  //   for (const [item, quantity] of this.validItems.entries()) {
  //     if (!this.itemInventory.has(item) || this.itemInventory.get(item) < quantity) return false;
  //   }
  //   return true;
  // }

  async getValidCardIds() {
    // Query the database for all cards that match the cardCodes in validCards
    const cards = await CardModel().find({ cardCode: { $in: Array.from(this.validCards) } });

    // Extract the _id fields from the resulting documents
    const cardIds = cards.map((card) => card._id);

    return cardIds;
  }

  async processTrade(cardIdsOffer, itemOffer) {
    // Remove the cards and items from the user's collection and inventory
    for (const card of this.validCards) {
      this.cardCollection.delete(card);
    }
    for (const [item, quantity] of this.validItems.entries()) {
      const newQuantity = this.itemInventory.get(item) - quantity;
      if (newQuantity <= 0) {
        this.itemInventory.delete(item);
      } else {
        this.itemInventory.set(item, newQuantity);
      }
    }

    // Add the cards and items from the trade offer
    for (const cardId of cardIdsOffer) {
      this.cardCollection.add(cardId);
    }
    for (const item of itemOffer) {
      this.itemInventory.set(item, (this.itemInventory.get(item) || 0) + 1);
    }

    // Save the updated collection and inventory only if they have been modified
    const savePromises = [];
    if (this.cardCollection.isModified()) {
      savePromises.push(this.cardCollection.save());
    }
    if (this.itemInventory.isModified()) {
      savePromises.push(this.itemInventory.save());
    }
    await Promise.all(savePromises);
  }
}

module.exports = TradeProfile;
