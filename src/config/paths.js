const path = require("path");

// Images
const IMAGES_PATH = path.join(__dirname + "../../../images");
const CARD_BORDERS_PATH = path.join(__dirname + "../../../images/borders");

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
  // Images
  IMAGES_PATH,
  CARD_BORDERS_PATH,

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
