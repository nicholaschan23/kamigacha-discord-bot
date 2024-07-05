const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { formatCardInfo } = require("../../../utils/gacha/format");
const { getDefaultSleeve } = require("../../../utils/graphics/getSleeve");
const { createCard } = require("../../../utils/graphics/createCard");
const { v4: uuidv4 } = require("uuid");

module.exports = async (data) => {
  const title = "Card Details";
  // const desc = `Character · ${data.character}\n` + `Series · ${data.series}\n`;
  // R`arity · ${data.rarity}\n``Code · ${data.code}\n``Owner · <@${data.ownerId}>`;

  const description = `Owned by <@${data.ownerId}>\n` + `\n` + `${formatCardInfo(data)}`;

  // Create the card image buffer
  const buffer = await createCard(data.image, getDefaultSleeve(data.rarity));

  // Create a unique attachment name
  const attachmentName = `pull-${uuidv4()}.png`;

  // Create an attachment from the buffer
  const imageFile = new AttachmentBuilder(buffer, { name: attachmentName });

  // Create the attachment URL
  const attachmentUrl = `attachment://${attachmentName}`;

  return [new EmbedBuilder().setTitle(title).setDescription(description).setImage(attachmentUrl), imageFile];
};
