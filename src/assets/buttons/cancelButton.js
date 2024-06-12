const { ButtonBuilder, ButtonStyle } = require("discord.js");

// module.exports = new ButtonBuilder()
//   .setCustomId("cancel")
//   .setEmoji("❌")
//   .setStyle(ButtonStyle.Secondary);

module.exports = new ButtonBuilder()
  .setCustomId("cancel")
  .setLabel("Cancel")
  .setStyle(ButtonStyle.Danger);
