const fsp = require("fs").promises;
const path = require("path");
const config = require("../../../config");
const { v4: uuidv4 } = require("uuid");
const { createCardGrid } = require("../../../utils/graphics/createCardGrid");
const { getDefaultSleeve } = require("../../../utils/graphics/getSleeve");

module.exports = async (dataList) => {
  const content = `<@${dataList[0].ownerId}> did a 10-card multi-pull!`;

  // Generating sleeveUrls and imageUrls arrays
  const imageUrls = dataList.map((card) => card.image);
  const sleeveUrls = dataList.map((card) => getDefaultSleeve(card.rarity));
  const buffer = await createCardGrid(imageUrls, sleeveUrls);
  const filePath = path.join(config.DEFAULT_SLEEVED_PATH, `multipull-${uuidv4()}.png`);
  await fsp.writeFile(filePath, buffer, () => {});

  return { content: content, files: [filePath] };
};
