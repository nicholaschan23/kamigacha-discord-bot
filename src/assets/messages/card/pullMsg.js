const { AttachmentBuilder } = require("discord.js");
const { createCard } = require("../../../utils/graphics/createCard");
const { getCardBorder } = require("../../../utils/graphics/getCardBorder");

module.exports = async (data) => {
  const content = `<@${data.ownerId}> did a 1-card pull!`;

  const cardUrl = data.image;
  const buffer = await createCard(cardUrl, getCardBorder(data.rarity));

  return { content: content, files: [new AttachmentBuilder(buffer)] };
};
