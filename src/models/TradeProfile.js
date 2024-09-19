const CardModel = require("../database/mongodb/models/card/card");
const CollectionModel = require("../database/mongodb/models/card/collection");
const InventoryModel = require("../database/mongodb/models/user/inventory");

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
