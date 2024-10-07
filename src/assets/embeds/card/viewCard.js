const { EmbedBuilder } = require("discord.js");
const { formatCardInfo } = require("@utils/string/format");
const { generateCardAttachment } = require("@utils/graphics/generateCardAttachment");

module.exports = async (data) => {
  const title = "Card Details";
  // const desc = `Character · ${data.character}\n` + `Series · ${data.series}\n`;
  // Rarity · ${data.rarity}\n``Code · ${data.code}\n``Owner · <@${data.ownerId}>`;

  const cardInfo = await formatCardInfo(data);
  const description = `Owned by <@${data.ownerId}>\n` + `\n` + `${cardInfo}`;

  const { file, url } = await generateCardAttachment(data);

  return {
    embed: new EmbedBuilder().setTitle(title).setDescription(description).setImage(url),
    file: file,
  };
};
