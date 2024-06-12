const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const options = [
  {
    label: "Settings",
    value: "settings",
    emoji: "⚙️",
  },
  {
    label: "Roles",
    value: "roles",
    emoji: "🏷️",
  },
  {
    label: "Forums",
    value: "forums",
    emoji: "📤",
  },
];

module.exports = new StringSelectMenuBuilder()
  .setCustomId("helpSelectMenu")
  .setPlaceholder("Select a topic")
  .setMinValues(1)
  .setMaxValues(1)
  .addOptions(options.map((help) => new StringSelectMenuOptionBuilder()
    .setLabel(help.label)
    .setValue(help.value)
    .setEmoji(help.emoji)));
