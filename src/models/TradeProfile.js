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
    this._validCards = new Set(); // { card code }
    this._validItems = new Map(); // { item name: quantity }

    // Initialized by fetchDocuments()
    this.cardCollection;
    this.itemInventory;
  }

  async fetchDocuments() {
    // Populate user's card collection and inventory in parallel
    const [collection, inventory] = await Promise.all([
      CollectionModel.findOneAndUpdate(
        {
          userId: this.user.id,
        },
        { $setOnInsert: { userId: this.user.id } },
        { new: true, upsert: true }
      ).populate("cardsOwned"),
      InventoryModel.findOneAndUpdate(
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

  async processOffer(modal) {
    // Save the offer input as an array
    this.offerInput = modal.fields
      .getTextInputValue("offerInput")
      .toLowerCase()
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
    this._validCards = new Set();
    this._validItems = new Map();
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
        this._validCards.add(code);
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
        this._validItems.set(itemName, this._validItems.get(itemName) || 0 + quantity);
      }
    }

    // Check for errors and send feedback
    if (errorCards.size > 0 || errorItems.size > 0) {
      const cards = Array.from(errorCards);
      const items = Array.from(errorItems.entries()).map(([key, value]) => `${value} ${key}`);
      const content = `❌ Invalid code or insufficient balance: ${[cards.map((code) => `\`${code}\``).join(", "), items.map((item) => `\`${item}\``).join(", ")]
        .filter(Boolean)
        .join(", ")}`;
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
    const cardsArr = this.validCards;
    const itemsArr = this.validItems.map(([item, quantity]) => `${quantity} ${item}`);
    const offer = [];
    if (cardsArr.length > 0) offer.push(cardsArr.join(", "));
    if (itemsArr.length > 0) offer.push(itemsArr.join(", "));
    if (offer.length === 0) return "";
    return offer.join(", ");
  }

  // /**
  //  * Fetches card document IDs of this profile's valid cards.
  //  * @returns {mongoose.Types.ObjectId[]} An array of card document IDs.
  //  */
  // async getValidCardIds() {
  //   if (this.validCards.length === 0) return [];
  //   return (await CardModel.find({ cardCode: { $in: this.validCards } }, "_id")).map((card) => card._id);
  // }

  /**
   * Returns an array of valid card codes.
   * @returns {String[]} An array of valid card codes.
   */
  get validCards() {
    return Array.from(this._validCards);
  }

  /**
   * Returns an array of valid items in the format {item, quantity}.
   * @returns {String[]} An array of valid items.
   */
  get validItems() {
    return Array.from(this._validItems.entries());
  }
}

module.exports = TradeProfile;
