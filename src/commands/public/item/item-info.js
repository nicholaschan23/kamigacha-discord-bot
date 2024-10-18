const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("@config");
const MapCache = require("@database/redis/cache/map");
const RedisClient = require("@database/redis/RedisClient");
const Logger = require("@utils/Logger");

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
        const series = tokens.slice(0, -2).join(" ");
        const seriesData = await MapCache.getMapEntry("card-model-map", series);
        if (!seriesData) {
          interaction.editReply({ content: "Invalid series name." });
          return;
        }

        const set = tokens[tokens.length - 2];
        const setData = seriesData[set];
        if (!setData) {
          interaction.editReply({ content: "Invalid set number." });
          return;
        }

        const formattedSeries = MapCache.getFormattedSeries(series);
        const embed = new EmbedBuilder()
          .setTitle(`Item Info`)
          .addFields({
            name: `${formattedSeries} ${set} Pack`,
            value: `Cost: 0\n` + `*A pack containing 1 card from set ${set} of the ${formattedSeries} series.*`,
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
