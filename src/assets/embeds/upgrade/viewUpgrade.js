const { EmbedBuilder } = require("discord.js");
const { formatCardInfo } = require("../../../utils/gacha/format");

module.exports = (data) => {
  const title = "Upgrade";
  const description = `Owned by: <@${data.ownerId}>\n` + `\n` + `${formatCardInfo(data)}`;

  return new EmbedBuilder().setTitle(title).setDescription(description);
};
