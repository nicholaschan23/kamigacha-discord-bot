const fs = require("fs").promises;
const Logger = require("../../utils/Logger");
const logger = new Logger("S3 structure");
const { listObjects } = require("./listObjects");
const { ensureDirExists } = require("../../utils/fileSystem");

const config = require("../../config");

async function saveS3StructureLocally(filePath, prefix) {
  const keys = await listObjects(prefix);

  const directoryStructure = keys.reduce((acc, key) => {
    const parts = key.slice(`${prefix}/`.length).split("/");
    const fileName = parts.pop();
    const fileType = fileName.slice(-4);

    if (fileType === ".jpg" || fileType === ".png") {
      let current = acc;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // If this is the last part, initialize it as an array if it doesn't exist
          if (!current[part]) {
            current[part] = [];
          }
          current[part].push(fileName);
        } else {
          // Otherwise, keep nesting
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      });
    }

    return acc;
  }, {});

  // Write data to file asynchronously
  await fs.writeFile(filePath, JSON.stringify(directoryStructure, null, 2), { flag: "w" }, (err) => {
    if (err) {
      logger.error("Error writing to file:" + err);
      throw err;
    } else {
      logger.success(`Saved S3 structure locally: ${prefix}`);
    }
  });
}

// Helper function to load structure from S3 if file does not exist
async function loadStructureIfNotExist(filePath, s3Path) {
  try {
    await fs.access(filePath);
    logger.info(`File structure from S3 Bucket already loaded: ${s3Path}`);
  } catch {
    await ensureDirExists(filePath);
    await saveS3StructureLocally(filePath, s3Path);
    logger.success(`File structure from S3 Bucket loaded: ${s3Path}`);
  }
}

// Main function to load S3 structures
async function loadS3Structures() {
  await loadStructureIfNotExist(config.CARD_MODEL_PATH, "cards");
  // await loadStructureIfNotExist(config.SLEEVE_MODEL_PATH, "customisations/sleeves");
  // await loadStructureIfNotExist(config.FRAME_MODEL_PATH, "customisations/frames");
}

// Function to get card structure
async function getCardStructure() {
  const data = await fs.readFile(config.CARD_MODEL_PATH, "utf8");
  const parsedJson = JSON.parse(data);
  const keys = Object.keys(parsedJson);
  return [parsedJson, keys];
}

// Function to get sleeve structure
async function getSleeveStructure() {
  const data = await fs.readFile(config.SLEEVE_MODEL_PATH, "utf8");
  return JSON.parse(data);
}

module.exports = {
  loadS3Structures,
  getCardStructure,
  getSleeveStructure,
};
