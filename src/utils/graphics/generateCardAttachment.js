const { AttachmentBuilder } = require("discord.js");
const { getCardBorder } = require("@utils/graphics/getCardBorder");
const { createCard } = require("@utils/graphics/createCard");
const { v4: uuidv4 } = require("uuid");

async function generateCardAttachment(card) {
  // Create the card image buffer
  const buffer = await createCard(card.image, getCardBorder(card.rarity));

  // Create a unique attachment name
  const attachmentName = `${uuidv4()}.png`;

  // Create an attachment from the buffer
  const imageFile = new AttachmentBuilder(buffer, { name: attachmentName });

  // Create the attachment URL
  const attachmentUrl = `attachment://${attachmentName}`;

  return {
    file: imageFile,
    url: attachmentUrl,
  };
}

module.exports = { generateCardAttachment };
