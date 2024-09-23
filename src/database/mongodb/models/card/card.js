const mongoose = require("mongoose");
const CollectionModel = require("./collection");

const cardSchema = new mongoose.Schema({
  // Unique card code identifier
  code: {
    type: String,
    unique: true,
    required: true,
  },

  // Series the card is from
  series: {
    type: String,
    required: true,
  },

  // Set number the card is from
  set: {
    type: Number,
    required: true,
  },

  // C, R, UR, SR, SSR
  rarity: {
    type: String,
    required: true,
  },

  // Name of the character
  character: {
    type: String,
    required: true,
  },

  // Current owner of the card
  ownerId: {
    type: String,
    required: true,
  },

  // Who pulled the card
  pulledId: {
    type: String,
  },

  // When the card was last modified in Unix time seconds
  modified: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },

  // When the card was pulled in Unix time seconds
  date: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },

  // Which guild this card was pulled in
  guildId: {
    type: String,
    required: true,
  },

  // How the card was generated
  generationType: {
    type: String,
    required: true,
  },

  // Collection tags
  tag: {
    type: String,
    default: "none",
  },
  emoji: {
    type: String,
    default: "▪️",
  },

  // CDN link to image database
  image: {
    type: String,
    required: true,
  },

  // Cosmetics
  sleeve: String,
  frame: String,
});

cardSchema.pre("save", async function (next) {
  // Update the modified field
  this.modified = Math.floor(Date.now() / 1000);

  // Handle ownerId changes
  if (this.isModified("ownerId")) {
    try {
      await Promise.all([
        // Remove card from old owner's collection
        CollectionModel.updateOne({ userId: this._originalOwnerId }, { $pull: { cardsOwned: this._id } }),
        // Add card to new owner's collection
        CollectionModel.updateOne({ userId: this.ownerId }, { $addToSet: { cardsOwned: this._id } }),
      ]);
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// Middleware to store the original ownerId before saving
cardSchema.pre("validate", function (next) {
  if (this.isModified("ownerId")) {
    this._originalOwnerId = this.ownerId;
  }
  next();
});

module.exports = mongoose.model("card", cardSchema);
