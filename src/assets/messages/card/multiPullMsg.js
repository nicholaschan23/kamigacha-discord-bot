const { AttachmentBuilder } = require("discord.js")
const { createCardGrid } = require("../../../utils/graphics/createCardGrid");
const { getDefaultSleeve } = require("../../../utils/graphics/getSleeve");

module.exports = async (dataList) => {
  const content = `<@${dataList[0].ownerId}> did a 10-card multi-pull!`;

  // Generating sleeveUrls and imageUrls arrays
  const imageUrls = dataList.map((card) => card.image);
  const sleeveUrls = dataList.map((card) => getDefaultSleeve(card.rarity));
  const buffer = await createCardGrid(imageUrls, sleeveUrls);

  return { content: content, files: [new AttachmentBuilder(buffer)] };
};
