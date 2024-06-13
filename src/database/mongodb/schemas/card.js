const mongoose = require("mongoose");

// Define a schema for storing pity timers
const cardSchema = new mongoose.Schema({
  code: String, // Unique card code identifier

  // Use to grab card image
  character: String, // Name of the character
  series: String, // Series the card is from
  set: Number, // Set number the card is from
  rarity: String, // C, R, UR, SR, SSR

  owner: String, // Current owner of the card
  pulled: String, // Who pulled the card

  timestamp: String, // When the card was pulled in Unix time in minutes
  guild: String, // Which guild this card was pulled in

  // Cosmetics
  sleeve: String,
  frame: String,
});

module.exports = cardSchema;
