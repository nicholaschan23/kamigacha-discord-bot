const mongoose = require("mongoose");
const config = require("@config");
const WishModel = require("@database/mongodb/models/user/wish");
const RedisClient = require("@database/redis/RedisClient");
const WishCache = require("@database/redis/cache/characterWish");
const WishCountCache = require("@database/redis/cache/characterWishCount");
const MapCache = require("@database/redis/cache/map");
const CharacterModel = require("@database/mongodb/models/global/character");
const Wish = require("@models/Wish");
const LookupPages = require("./LookupPages");

const redis = RedisClient.connection;

class WishListAddButtonPages extends LookupPages {
  constructor(interaction, pageData) {
    super(interaction, pageData);
  }

  async handleSelect(interaction, value) {
    const embed = this.pages[this.index];

    const wish = new Wish(JSON.parse(value));
    const formattedCharacter = await MapCache.getFormattedCharacter(wish.character);
    const formattedSeries = await MapCache.getFormattedSeries(wish.series);

    const session = await mongoose.startSession();
    session.startTransaction();

    let messaged = false;
    let wishDocument, characterDocument;
    try {
      // Add wish to wish list
      wishDocument = await WishModel.findOneAndUpdate(
        { userId: interaction.user.id, wishList: { $not: { $elemMatch: wish } } },
        {
          $push: {
            wishList: {
              $each: [wish],
              $sort: { series: 1, character: 1 },
            },
          },
        },
        { new: true, session: session }
      );

      // Prevent duplicate wish list entries
      if (!wishDocument) {
        interaction.followUp({ content: `**${formattedCharacter}** · ${formattedSeries} is already on your wish list.` });
        messaged = true;
        throw new Error("Duplicate wish list entry");
      }

      // Add wish count to character
      characterDocument = await CharacterModel.findOneAndUpdate(
        { character: wish.character, series: wish.series },
        { $inc: { wishCount: 1 } },
        { new: true, session: session }
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

      if (!messaged) interaction.followUp({ content: "There was an issue adding to your wish list. Please try again." });
      return;
    }

    // Update cache
    await Promise.all([WishCache.cache(interaction.user.id, wishDocument), WishCountCache.cache(wish.character, wish.series, characterDocument.wishCount)]);

    // Send message
    embed.setColor(config.embedColor.green);
    this.collector.stop();
    interaction.followUp({
      content: `✅ Successfully added **${formattedCharacter}** · ${formattedSeries} to your wish list!`,
    });
  }
}

module.exports = WishListAddButtonPages;
