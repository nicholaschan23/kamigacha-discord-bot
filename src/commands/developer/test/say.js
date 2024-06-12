const { SlashCommandSubcommandGroupBuilder } = require("discord.js");
const utils = require("../../../utils");
const logger = new utils.Logger("Say");
const bye = require("./say/bye");
const hello = require("./say/hello");

module.exports = {
  category: "developer/test",
  data: new SlashCommandSubcommandGroupBuilder().setName("say").setDescription("Say something.").addSubcommand(bye.data).addSubcommand(hello.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "bye": {
        await bye.execute(client, interaction);
        break;
      }
      case "hello": {
        await hello.execute(client, interaction);
        break;
      }
      default: {
        const message = `There was no execute case for the '${subcommand}' subcommand.`;
        logger.error(message);
        return interaction.reply(message);
      }
    }
  },
};
