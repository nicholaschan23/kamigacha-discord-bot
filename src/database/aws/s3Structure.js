const fsp = require("fs").promises;
const Logger = require("../../utils/Logger");
const logger = new Logger("S3 structure");
const { listObjects } = require("./listObjects");

async function saveS3Structure(filePath, prefix) {
  const keys = await listObjects(prefix);

  const directoryStructure = keys.reduce((acc, key) => {
    const parts = key.slice(`${prefix}/`.length).split("/");
    const fileName = parts.pop();
    const fileType = fileName.slice(-4);

    if (fileType === ".jpg") {
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
  try {
    await fsp.writeFile(filePath, JSON.stringify(directoryStructure, null, 2), { flag: "w" });
    logger.success(`Saved S3 structure for key: ${prefix}`);
  } catch (err) {
    logger.error("Error writing to file:" + err);
    throw err;
  }
}

module.exports = {
  saveS3Structure,
};
