const s3 = require("./awsConfig");
const fs = require("fs");
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const Logger = require("../../utils/Logger");
const logger = new Logger("S3 structure");

async function listAllObjects(prefix) {
  let isTruncated = true;
  let marker;
  const allKeys = [];

  while (isTruncated) {
    const params = {
      Bucket: BUCKET_NAME,
      Marker: marker,
      Prefix: prefix,
    };

    try {
      const response = await s3.listObjects(params).promise();
      response.Contents.forEach((item) => {
        allKeys.push(item.Key);
      });

      isTruncated = response.IsTruncated;
      if (isTruncated) {
        marker = response.Contents.slice(-1)[0].Key;
      }
    } catch (error) {
      logger.error("Error listing objects:", error);
      throw error;
    }
  }

  return allKeys;
}

async function saveS3StructureLocally(filePath, prefix) {
  try {
    const keys = await listAllObjects(BUCKET_NAME, prefix);
    const directoryStructure = keys.reduce((acc, key) => {
      const parts = key.split("/");
      let current = acc;
      parts.forEach((part) => {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      });
      return acc;
    }, {});

    fs.writeFileSync(filePath, JSON.stringify(directoryStructure, null, 2));
    logger.log("S3 structure saved locally.");
  } catch (error) {
    logger.error("Error saving S3 structure locally:", error);
  }
}

const CARDS_FILE_PATH = "cards.json";
const SLEEVES_FILE_PATH = "sleeves.json";
const FRAMES_FILE_PATH = "frames.json";

async function loadS3Structures() {
  // If JSON file doesn't exist, create it from S3 Bucket
  if (!fs.existsSync(CARDS_FILE_PATH)) {
    await saveS3StructureLocally(CARDS_FILE_PATH, "cards");
    logger.success(`File structure from S3 Bucket loaded: ${CARDS_FILE_PATH}`);
  } else {
    logger.info(`File structure from S3 Bucket already loaded: ${CARDS_FILE_PATH}`);
  }
  // if (!fs.existsSync(SLEEVES_FILE_PATH)) {
  //   await saveS3StructureLocally(SLEEVES_FILE_PATH, "sleeves");
  // }
  // if (!fs.existsSync(FRAMES_FILE_PATH)) {
  //   await saveS3StructureLocally(FRAMES_FILE_PATH, "frames");
  // }
}

let cardS3Structure = null;
async function getCardStructure() {
  if (!cardS3Structure) {
    const data = fs.readFileSync(CARDS_FILE_PATH);
    cardS3Structure = JSON.parse(data);
  }
  const seriesKeys = Object.keys(cardS3Structure);
  return [cardS3Structure, seriesKeys];
}

let sleeveS3Structure = null;
async function getSleeveStructure() {
  if (!sleeveS3Structure) {
    const data = fs.readFileSync(SLEEVES_FILE_PATH);
    sleeveS3Structure = JSON.parse(data);
  }
  return sleeveS3Structure;
}

let frameS3Structure = null;
async function getFrameStructure() {
  if (!frameS3Structure) {
    const data = fs.readFileSync(FRAMES_FILE_PATH);
    frameS3Structure = JSON.parse(data);
  }
  return frameS3Structure;
}

module.exports = { loadS3Structures, getCardStructure };
