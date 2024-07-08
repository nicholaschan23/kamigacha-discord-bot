const fsp = require("fs").promises;
const Logger = require("../../../utils/Logger");
const logger = new Logger("Card model");
const config = require("../../../config");
const { ensureDirExists } = require("../../../utils/fileSystem");
const { saveS3Structure } = require("../s3Structure");

async function loadCardModel() {
  try {
    await fsp.access(config.CARD_MODEL_PATH);
    logger.info(`Loaded model: cards`);
  } catch {
    await ensureDirExists(config.CARD_MODEL_PATH);
    await saveS3Structure(config.CARD_MODEL_PATH, "cards");
  }

  const data = await fsp.readFile(config.CARD_MODEL_PATH, "utf8");
  const parsedJson = JSON.parse(data);
  const keys = Object.keys(parsedJson);
  return { object: parsedJson, keys: keys };
}

module.exports = { loadCardModel };
