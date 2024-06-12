module.exports = {
  id: "byeModal",

  async execute(client, interaction) {
    const amount = interaction.fields.getTextInputValue("byeAmount");
    if (isNaN(amount)) {
      return await interaction.reply("Please input a valid number.");
    }

    await interaction.reply({
      content: "Bye! ".repeat(amount),
    });
    return;
  },
};
