const { EmbedBuilder } = require("discord.js");
const { formatCardInfoPage } = require("../../../utils/gacha/format");

module.exports = (dataList) => {
  const title = "Multi-Pull";
  const description = `Owned by: <@${dataList[0].ownerID}>\n` + `\n` + `${formatCardInfoPage(dataList)}`;

  return new EmbedBuilder().setTitle(title).setDescription(description);
};
