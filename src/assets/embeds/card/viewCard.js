const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { formatCardInfo } = require("../../../utils/gacha/format");
const { getDefaultSleeve } = require("../../../utils/graphics/getSleeve");
const { createCardImage, overlayImages } = require("../../../utils/graphics/createCardImage");
const path = require("path");

module.exports = async (data) => {
  const title = "Card Details";
  const description = `Owned by <@${data.ownerId}>\n` + `\n` + `${formatCardInfo(data)}`;
  
  const imagePath = await overlayImages(data.image, getDefaultSleeve(data.rarity));
  const imageFile = new AttachmentBuilder(imagePath);

  // const image = await createCardImage(data.image, getDefaultSleeve(data.rarity));
  const attachmentUrl = `attachment://${path.basename(imagePath)}`;

  return [new EmbedBuilder().setTitle(title).setDescription(description).setImage(attachmentUrl), imageFile];
};
