const path = require("path");

// Images
const DEFAULT_SLEEVED_PATH = path.join(__dirname + "../../../images/cards/default-sleeved");
const RAW_SCALED_PATH = path.join(__dirname + "../../../images/cards/raw-scaled");

// Models
const CARD_MODEL_PATH = path.join(__dirname, "models/cards.json");
const SLEEVE_MODEL_PATH = path.join(__dirname, "models/sleeves.json");
const FRAME_MODEL_PATH = path.join(__dirname, "models/frames.json");

module.exports = {
  DEFAULT_SLEEVED_PATH,
  RAW_SCALED_PATH,
  CARD_MODEL_PATH,
  SLEEVE_MODEL_PATH,
  FRAME_MODEL_PATH,
};
