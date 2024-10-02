const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js");
const mongoose = require("mongoose");
const config = require("@config");
const RedisClient = require("@database/redis/RedisClient");
const WishCache = require("@database/redis/cache/characterWish");
const WishCountCache = require("@database/redis/cache/characterWishCount");
const WishModel = require("@database/mongodb/models/user/wish");
const CharacterModel = require("@database/mongodb/models/global/character");
const Wish = require("@models/Wish");
const { formatWishListPage } = require("@utils/string/formatPage");
const LookupPages = require("./LookupPages");

const redis = RedisClient.connection;

class WishListRemoveButtonPages extends LookupPages {
  constructor(interaction, wishDocument) {
    super(interaction, wishDocument.wishList);
    this.user = interaction.user;
    this.wishListLimit = wishDocument.wishListLimit;
  }

  /**
   * Helper function to create embeds for each page.
   *
   * @param {Array<Array>} pageDataChunks - An array of arrays, where each inner array contains string data to format.
   */
  createPages(pageDataChunks = this.pageDataChunks) {
    const pages = [];

    for (let i = 0; i < pageDataChunks.length; i++) {
      const embed = new EmbedBuilder()
        .setTitle(`Wish List`)
        .setDescription(
          `Owned by ${this.user}\n` +
            `Available slots: **${this.wishListLimit - this.pageData.length}**/${this.wishListLimit}\n\n` +
            `${formatWishListPage(pageDataChunks[i])}`
        )
        .setFooter({
          text: `Showing characters ${(i * 10 + 1).toLocaleString()}-${(
            i * 10 +
            pageDataChunks[i].length
          ).toLocaleString()} (${this.pageData.length.toLocaleString()} total)`,
        });
      pages.push(embed);
    }

    this.pages = pages;
    this.index = 0;
  }

  updateSelectMenu() {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("characterSelect")
      .setPlaceholder("Select a character")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        this.pageDataChunks[this.index].map(async ({ character, series }) =>
          new StringSelectMenuOptionBuilder().setLabel(await redis.hget(character)).setValue(`${JSON.stringify({ character: character, series: series })}`)
        )
      );
    this.components["characterSelect"] = selectMenu;
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.messageComponents.push(selectRow);
  }

  async handleSelect(interaction, value) {
    const embed = this.pages[this.index];

    const wish = new Wish(JSON.parse(value));
    const formattedCharacter = await redis.hget("characterNameMap", wish.character);
    const formattedSeries = await redis.hget("seriesNameMap", wish.series);

    const session = await mongoose.startSession();
    session.startTransaction();

    let messaged = false;
    let wishDocument, characterDocument;
    try {
      // Remove wish from wish list
      wishDocument = await WishModel.findOneAndUpdate(
        { userId: interaction.user.id, wishList: { $elemMatch: wish } },
        {
          $pull: {
            wishList: wish,
          },
        },
        { new: true, session: session }
      );

      // Wish list entry was not found to remove
      if (!wishDocument) {
        interaction.followUp({ content: `**${formattedCharacter}** · ${formattedSeries} is not on your wish list.` });
        messaged = true;
        throw new Error("Wish list entry not found");
      }

      // Remove wish count from character
      characterDocument = await CharacterModel.findOneAndUpdate(
        { character: wish.character, series: wish.series },
        { $inc: { wishCount: -1 } },
        { new: true, session: session, select: "wishCount" }
      );

      // Character not found in database
      if (!characterDocument) {
        throw new Error("Couldn't find character in database");
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      embed.setColor(config.embedColor.red);
      this.collector.stop();

      if (!messaged) interaction.followUp({ content: "There was an issue removing from your wish list. Please try again." });
      return;
    }

    // Update cache
    await Promise.all([WishCache.cache(interaction.user.id, wishDocument), WishCountCache.cache(wish.character, wish.series, characterDocument.wishCount)]);

    embed.setColor(config.embedColor.green);
    this.collector.stop();
    interaction.followUp({
      content: `✅ Successfully removed **${formattedCharacter}** · ${formattedSeries} from your wish list!`,
    });
  }
}

module.exports = WishListRemoveButtonPages;
