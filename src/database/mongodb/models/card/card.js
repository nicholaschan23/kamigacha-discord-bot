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
  ownerID: {
    type: String,
    required: true,
  },

  // Who pulled the card
  pulledID: {
    type: String,
  },

  // When the card was pulled in Unix time in seconds
  unixTimeSeconds: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },

  // Which guild this card was pulled in
  guildID: {
    type: String,
    required: true,
  },

  // How the card was generated
  generationType: {
    type: String,
    required: true,
  },

  tag: {
    type: String,
    default: ":black_small_square:",
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

module.exports = (client) => {
  const database = client.cardDB;
  return database.model("card", cardSchema);
};