const { SlashCommandSubcommandBuilder, parseEmoji } = require("discord.js");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("Delete a collection tag.")
    .addStringOption((option) => option.setName("tag").setDescription("Name of tag to delete.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();
    const tag = interaction.options.getString("tag");
    const emoji = interaction.options.getString("emoji");

    if (!parseEmoji(emoji)) {
      return interaction.editReply({ content: `Please input a valid Discord emoji.` });
    }
    interaction.editReply({ content: `Done!` });
  },
};
