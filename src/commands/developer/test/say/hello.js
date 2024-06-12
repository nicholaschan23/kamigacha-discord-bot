const { SlashCommandSubcommandBuilder } = require("discord.js");

module.exports = {
  category: "developer/test/say",
  data: new SlashCommandSubcommandBuilder().setName("hello").setDescription("Say hello."),

  async execute(client, interaction) {
    return interaction.reply({ content: `Hello.` });
  },
};
