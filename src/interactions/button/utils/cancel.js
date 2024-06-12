module.exports = {
  id: "cancel",

  // Removes all components where the cancel buttons was
  async execute(client, interaction) {
    await interaction.update({
      components: [],
    });
    return;
  },
};
