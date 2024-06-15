const { SlashCommandSubcommandBuilder } = require("discord.js");

module.exports = {
  category: "developer/test/say",
  data: new SlashCommandSubcommandBuilder().setName("bye").setDescription("Say bye."),

  async execute(client, interaction) {
    return interaction.reply({ content: `Bye.` });
  },
};
