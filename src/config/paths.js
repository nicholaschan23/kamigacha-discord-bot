const path = require("path");

// Images
const ASSETS_PATH = path.join(__dirname + "../../../assets");

// Maps
const CHARACTER_NAME_MAP_PATH = path.join(__dirname, "../database/aws/maps/formatted-character-names.json");
const SERIES_NAME_MAP_PATH = path.join(__dirname, "../database/aws/maps/formatted-series-names.json");

// Models
const CARD_MODEL_PATH = path.join(__dirname, "../database/aws/models/cards.json");
const CHARACTER_MODEL_PATH = path.join(__dirname, "../database/aws/models/characters.json");
const SEARCH_MODEL_PATH = path.join(__dirname, "../database/aws/models/searches.json");
const SLEEVE_MODEL_PATH = path.join(__dirname, "../database/aws/models/sleeves.json");
const FRAME_MODEL_PATH = path.join(__dirname, "../database/aws/models/frames.json");

module.exports = {
  ASSETS_PATH,

  // Maps
  CHARACTER_NAME_MAP_PATH,
  SERIES_NAME_MAP_PATH,

  // Models
  CARD_MODEL_PATH,
  CHARACTER_MODEL_PATH,
  SEARCH_MODEL_PATH,
  SLEEVE_MODEL_PATH,
  FRAME_MODEL_PATH,
};
