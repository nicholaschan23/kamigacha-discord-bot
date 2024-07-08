const fsp = require("fs").promises;
const path = require("path");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Load formatted names");
const { ensureDirExists } = require("../../../utils/fileSystem")

// Remove dashes and capitalize first letter of each word
function formatName(name) {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function createNameMap(names, existingMap) {
  return names.reduce((map, name) => {
    if (!map[name]) {
      map[name] = formatName(name);
    }
    return map;
  }, existingMap);
}

async function loadNameMap(filePath) {
  try {
    await ensureDirExists(filePath);
    const data = await fsp.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      // If the file does not exist, return an empty object
      return {};
    } else {
      throw err;
    }
  }
}

async function saveNameMap(map, filePath) {
  await fsp.writeFile(filePath, JSON.stringify(map, null, 2), "utf8");
  logger.success("Saved: " + path.basename(filePath));
}

async function loadFormattedNames(keys, filePath) {
  const existingMap = await loadNameMap(filePath);
  const updatedMap = createNameMap(keys, existingMap);
  await saveNameMap(updatedMap, filePath);
  return await loadNameMap(filePath);
}

module.exports = { loadFormattedNames };
