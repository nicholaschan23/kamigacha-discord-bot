const { ComponentType } = require("discord.js");
const settingsEmbed = require("../../../assets/embeds/help/settingsEmbed");
const rolesEmbed = require("../../../assets/embeds/help/rolesEmbed");
const forumsEmbed = require("../../../assets/embeds/help/forumsEmbed");
const utils = require("../../../utils");
const logger = new utils.Logger("Update Help Embed");

module.exports = {
  id: "helpSelectMenu",

  async execute(client, interaction) {
    try {
      const choice = interaction.values[0];

      let embed;
      switch (choice) {
        case "settings": {
          embed = settingsEmbed;
          break;
        }
        case "roles": {
          embed = rolesEmbed;
          break;
        }
        case "forums": {
          embed = forumsEmbed;
          break;
        }
      }
      await interaction.update({
        embeds: [embed],
      });
    } catch (error) {
      logger.error(error.stack);
    }
  },
};
