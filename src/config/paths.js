const path = require("path");

// Images
const IMAGES_PATH = path.join(__dirname + "../../../images");
const CARD_BORDERS_PATH = path.join(__dirname + "../../../images/borders");

// Models
const CARD_MODEL_PATH = path.join(__dirname, "../database/aws/models/cards.json");
const SLEEVE_MODEL_PATH = path.join(__dirname, "../database/aws/models/sleeves.json");
const FRAME_MODEL_PATH = path.join(__dirname, "../database/aws/models/frames.json");

module.exports = {
  IMAGES_PATH,
  CARD_BORDERS_PATH,
  CARD_MODEL_PATH,
  SLEEVE_MODEL_PATH,
  FRAME_MODEL_PATH,
};
