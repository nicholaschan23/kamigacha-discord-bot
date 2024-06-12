const { SlashCommandSubcommandBuilder } = require("discord.js");
// const { options } = require("../../../assets/selectMenu/helpSelectMenu");

module.exports = {
  category: "developer/test",
  data: new SlashCommandSubcommandBuilder()
    .setName("shout")
    .setDescription("Shout something!")
    .addStringOption((option) => option.setName("sentence").setDescription("The sentence you will shout!").setRequired(true).setAutocomplete(true)),

  async execute(client, interaction) {
    const sentence = interaction.options.getString("sentence");

    return interaction.reply({ content: sentence });
  },
};
