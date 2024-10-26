const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("help").setDescription("Visit our wiki page."),

  async execute(client, interaction) {
    // TODO: Replace this with a list of basic commands.
    await interaction.user.send("Placeholder for basic commands list.");

    const embed = new EmbedBuilder().setTitle("Help").setDescription("Check your DMs for a list of basic commands. Click the button below for more information on our wiki page.");
    const button = new ButtonBuilder().setLabel("Visit Wiki").setStyle(ButtonStyle.Link).setURL("https://your-wiki-link.com");
    const row = new ActionRowBuilder().addComponents(button);
    interaction.reply({ embeds: [embed], components: [row] });
  },
};
