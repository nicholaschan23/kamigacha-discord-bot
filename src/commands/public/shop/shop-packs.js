const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("@config");
const MapCache = require("@database/redis/cache/map");
const RedisClient = require("@database/redis/RedisClient");
const Logger = require("@utils/Logger");
const { fetchRarityCounts, calculatePackValue } = require("@utils/gacha/calculatePackValue");

const logger = new Logger("Shop packs command");
const redis = RedisClient.connection;

module.exports = {
  category: "public/shop",
  data: new SlashCommandSubcommandBuilder()
    .setName("packs")
    .setDescription("View purchasable card packs.")
    .addStringOption((option) => option.setName("series").setDescription("Series name to buy packs from.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();
  }
}