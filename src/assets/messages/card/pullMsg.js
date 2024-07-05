const fsp = require("fs").promises;
const path = require("path");
const config = require("../../../config");
const { v4: uuidv4 } = require("uuid");
const { createCard } = require("../../../utils/graphics/createCard");
const { getDefaultSleeve } = require("../../../utils/graphics/getSleeve");

module.exports = async (data) => {
  const content = `<@${data.ownerId}> did a 1-card pull!`;

  const cardUrl = data.image;
  const buffer = await createCard(cardUrl, getDefaultSleeve(data.rarity));
  const filePath = path.join(config.DEFAULT_SLEEVED_PATH, `pull-${uuidv4()}.png`);
  await fsp.writeFile(filePath, buffer, () => {});

  return { content: content, files: [filePath] };
};
