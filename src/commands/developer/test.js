const { SlashCommandBuilder } = require("discord.js");
const utils = require("../../utils");
const logger = new utils.Logger("test");
const say = require("./test/say.js");
const shout = require("./test/shout.js");

module.exports = {
  category: "developer",
  cooldown: 0,
  data: new SlashCommandBuilder().setName("test").setDescription("Test a bot feature.").addSubcommandGroup(say.data).addSubcommand(shout.data),

  async execute(client, interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    if (subcommandGroup) {
      switch (subcommandGroup) {
        case "say": {
          await say.execute(client, interaction);
          break;
        }
        default: {
          const message = `There was no execute case for the '${subcommandGroup}' subcommand group.`;
          logger.error(message);
          return interaction.reply(message);
        }
      }
    } else if (subcommand) {
      switch (subcommand) {
        case "shout": {
          await shout.execute(client, interaction);
          break;
        }
        default: {
          const message = `There was no execute case for the '${subcommand}' subcommand.`;
          logger.error(message);
          return interaction.reply(message);
        }
      }
    }
  },
};
