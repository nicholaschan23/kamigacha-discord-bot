const viewCardEmbed = require("../card/viewCard");
const config = require("../../../config");

module.exports = async (data) => {
  const { embed, file } = await viewCardEmbed(data);
  return {
    embed: embed.setTitle("Upgrade").setColor(config.embedColor.green),
    file: file,
  };
};
