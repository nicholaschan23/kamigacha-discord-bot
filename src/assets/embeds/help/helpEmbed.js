const { EmbedBuilder } = require("discord.js");

// Use this as a reference to build your own embeds:
// https://discordjs.guide/popular-topics/embeds.html#using-the-embed-constructor
module.exports = new EmbedBuilder()
  .setTitle(`Help`)
  .setDescription(`Select the topic you'd like help with using the dropdown menu below.`);
