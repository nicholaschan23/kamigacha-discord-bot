const { SlashCommandSubcommandBuilder, parseEmoji } = require("discord.js");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("emoji")
    .setDescription("Change the emoji of a collection tag.")
    .addStringOption((option) => option.setName("tag").setDescription("Name of tag.").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("New emoji to associate with tag.").setRequired(true)),

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
