const { EmbedBuilder } = require("discord.js");

module.exports = (model) => {
  const userId = model.userId;
  const cdPull = model.cooldownPull;
  const cdMultiPull = model.cooldownMultiPull;
  const unixTimeNow = Math.floor(Date.now() / 1000);

  const title = "Cooldowns";
  const description =
    `Showing cooldowns for <@${userId}>\n` +
    `\n` +
    `${cdPull <= unixTimeNow ? "**Pull** is currently available" : `**Pull** is available in <t:${cdPull}>`}\n` +
    `${cdPull <= unixTimeNow ? "**Multi-Pull** is currently available" : `**Multi-Pull** is available in <t:${cdMultiPull}>`}`;

  return new EmbedBuilder().setTitle(title).setDescription(description);
};
