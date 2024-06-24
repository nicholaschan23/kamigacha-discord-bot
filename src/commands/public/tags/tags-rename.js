const { SlashCommandSubcommandBuilder, parseEmoji } = require("discord.js");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("rename")
    .setDescription("Rename a collection tag.")
    .addStringOption((option) => option.setName("old_name").setDescription("Current name of tag to rename.").setRequired(true))
    .addStringOption((option) => option.setName("new_name").setDescription("New name to assign to tag.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();
    const tag = interaction.options.getString("tag");
    const rename = interaction.options.getString("rename");

    if (!parseEmoji(emoji)) {
      return interaction.editReply({ content: `Please input a valid Discord emoji.` });
    }
    interaction.editReply({ content: `Done!` });
  },
};
