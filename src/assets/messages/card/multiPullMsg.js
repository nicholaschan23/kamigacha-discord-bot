const { AttachmentBuilder } = require("discord.js");
const { createCardGrid } = require("../../../utils/graphics/createCardGrid");
const { getCardBorder } = require("../../../utils/graphics/getCardBorder");

module.exports = async (dataList) => {
  const content = `<@${dataList[0].ownerId}> did a 10-card multi-pull!`;

  // Generating sleeveUrls and imageUrls arrays
  const imageUrls = dataList.map((card) => card.image);
  const borderPaths = dataList.map((card) => getCardBorder(card.rarity));
  const buffer = await createCardGrid(imageUrls, borderPaths);

  return { content: content, files: [new AttachmentBuilder(buffer)] };
};
