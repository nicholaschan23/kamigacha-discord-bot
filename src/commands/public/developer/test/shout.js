const { SlashCommandSubcommandBuilder } = require("discord.js");

module.exports = {
  category: "developer/test",
  data: new SlashCommandSubcommandBuilder().setName("shout").setDescription("Shout!"),

  async execute(client, interaction) {
    return interaction.reply({ content: `Shout!` });
  },
};
