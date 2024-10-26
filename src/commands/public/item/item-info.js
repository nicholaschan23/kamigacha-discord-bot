const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("@config");
const MapCache = require("@database/redis/cache/map");
const RedisClient = require("@database/redis/RedisClient");
const Logger = require("@utils/Logger");
const { fetchRarityCounts, calculatePackValue } = require("@utils/gacha/calculatePackValue");

const logger = new Logger("Item info command");
const redis = RedisClient.connection;

module.exports = {
  category: "public/item",
  data: new SlashCommandSubcommandBuilder()
    .setName("info")
    .setDescription("View item info.")
    .addStringOption((option) => option.setName("item").setDescription("Item name to view info on.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    try {
      const item = interaction.options.getString("item").replace(/-/g, " ").replace(/\s+/g, " ").toLowerCase().trim();

      const tokens = item.split(" ");
      if (tokens[tokens.length - 1] === "pack") {
        const seriesKey = tokens.slice(0, -2).join("-");
        const seriesData = await MapCache.getMapEntry("card-model-map", seriesKey);
        if (!seriesData) {
          interaction.editReply({ content: "Invalid series name." });
          return;
        }

        const set = tokens[tokens.length - 2];
        const setCount = Object.keys(seriesData).length;
        if (parseInt(set) > setCount) {
          interaction.editReply({ content: "Invalid set number." });
          return;
        }

        const materialCode = "tear material"
        const formattedSeries = await MapCache.getFormattedSeries(seriesKey);
        const itemCode = tokens.join("-");
        const icon = config.itemsMap.get(materialCode).icon;
        const cost = calculatePackValue(fetchRarityCounts(seriesData[set]));
        const purchasable = set == setCount ? "Purchasable" : "Not available";
        const embed = new EmbedBuilder().setTitle(`Item Info`).addFields({
          name: `Set ${set} Pack: ${formattedSeries}`,
          value: `*A card pack containing 1 card from set ${set} of the ${formattedSeries} series.*\n\n` + `Price: ${icon} **${cost}** \`${materialCode}\``,
        });

        interaction.editReply({ embeds: [embed] });
        return;
      }

      const itemInfo = config.itemsMap.get(item);
      if (itemInfo) {
        const embed = new EmbedBuilder().setTitle("Item Info").addFields({
          name: itemInfo.name,
          value: `*${itemInfo.description}*`,
        });
        interaction.editReply({ embeds: [embed] });
        return;
      }

      interaction.editReply({ content: "Item not found." });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue viewing the item info. Please try again." });
    }
  },
};
