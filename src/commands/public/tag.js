const { SlashCommandBuilder } = require("discord.js");
const Logger = require("../../utils/Logger");
const logger = new Logger("Tag command");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("tag")
    .setDescription("Tag a card in your collection.")
    .addStringOption((option) => option.setName("tag").setDescription("Tag name.").setRequired(true))
    .addStringOption((option) => option.setName("codes").setDescription("Cards you want to associate with this tag.").setRequired(true)),

  async execute(client, interaction) {
    
  },
};
