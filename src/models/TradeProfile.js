const CollectionModel = require("../database/mongodb/models/card/collection");
const InventoryModel = require("../database/mongodb/models/user/inventory");

class TradeProfile {
  constructor(user) {
    this.user = user;

    this.offerInput = "";
    this.validCards = new Set(); // { card code }
    this.validItems = new Map(); // { item name: quantity }

    // Set by fetchDocuments()
    this.collectionDocument;
    this.inventoryDocument;
  }

  get user() {
    return this.user;
  }

  get id() {
    return this.user.id;
  }

  get offerInput() {
    return this.offerInput;
  }

  set offerInput(value) {
    this.offerInput = value;
  }

  async fetchDocuments() {
    // Populate user's card collection and inventory in parallel
    const [collection, inventory] = await Promise.all([CollectionModel().findOne({ userId: this.getUserId() }).populate("cardsOwned"), InventoryModel().findOne({ userId: this.getUserId() })]);
    this.collectionDocument = collection;
    this.inventoryDocument = inventory;
  }
}

module.exports = TradeProfile;
