const { EmbedBuilder } = require("discord.js");
const { formatCardInfo } = require("../../../utils/gacha/format");

module.exports = (data) => {
  const title = "Card Details";
  const description = `Owned by <@${data.ownerID}>\n` + `\n` + `${formatCardInfo(data)}`;

  return new EmbedBuilder().setTitle(title).setDescription(description);
};
