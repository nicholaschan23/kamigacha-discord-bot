const { SlashCommandBuilder } = require("discord.js");
const CardModel = require("../../database/mongodb/models/card/card");
const viewCardEmbed = require("../../assets/embeds/card/viewCard");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("view")
    .setDescription("Display a card.")
    .addStringOption((option) => option.setName("code").setDescription("Card code.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();
    const code = interaction.options.getString("code");
    const data = await CardModel(client).findOne({ code: code });
    if (data) {
      return interaction.editReply({ embeds: [viewCardEmbed(data)] });
    }
    return interaction.editReply({ content: "That card code does not exist.", ephemeral: true });
  },
};
