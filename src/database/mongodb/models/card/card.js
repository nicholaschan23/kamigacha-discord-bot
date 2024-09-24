const mongoose = require("mongoose");

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

module.exports = mongoose.model("card", cardSchema);
