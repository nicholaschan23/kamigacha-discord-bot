const { AttachmentBuilder } = require("discord.js");
const { createCard } = require("../../../utils/graphics/createCard");
const { getDefaultSleeve } = require("../../../utils/graphics/getSleeve");

module.exports = async (data) => {
  const content = `<@${data.ownerId}> did a 1-card pull!`;

  const cardUrl = data.image;
  const buffer = await createCard(cardUrl, getDefaultSleeve(data.rarity));

  return { content: content, files: [new AttachmentBuilder(buffer)] };
};
