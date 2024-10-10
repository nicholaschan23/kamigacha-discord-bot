const config = require("@config");

const CharacterModel = require("@database/mongodb/models/global/character");
const WishModel = require("@database/mongodb/models/user/wish");

const MapCache = require("@database/redis/cache/map");
const WishCache = require("@database/redis/cache/characterWish");
const WishCountCache = require("@database/redis/cache/characterWishCount");

const Wish = require("@models/Wish");
const LookupPages = require("@utils/pages/LookupPages");

class WishListAddButtonPages extends LookupPages {
  constructor(interaction, pageData) {
    super(interaction, pageData);
  }

  async handleSelect(interaction, value) {
    const embed = this.pages[this.index];

    // Parse the wish from the selected value
    const wish = new Wish(JSON.parse(value));

    // Get formatted character and series names from cache
    const formattedCharacter = await MapCache.getFormattedCharacter(wish.character);
    const formattedSeries = await MapCache.getFormattedSeries(wish.series);

    // Start a MongoDB session for transaction
    const session = await WishModel.startSession();
    session.startTransaction();

    let messaged = false;
    let wishDocument, characterDocument;

    try {
      // Add wish to wish list if it doesn't already exist
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
        interaction.followUp({ content: `❌ **${formattedCharacter}** · ${formattedSeries} is already on your wish list.` });
        messaged = true;
        throw new Error("Duplicate wish list entry");
      }

      // Increment wish count for the character in the database
      characterDocument = await CharacterModel.findOneAndUpdate(
        { character: wish.character, series: wish.series },
        { $inc: { wishCount: 1 } },
        { new: true, session: session, select: "wishCount" }
      );

      // Character not found in database
      if (!characterDocument) {
        throw new Error("Couldn't find character in database");
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      // Abort the transaction in case of error
      await session.abortTransaction();
      session.endSession();

      // Set embed color to red to indicate error
      embed.setColor(config.embedColor.red);
      this.collector.stop();

      // Send error message if not already sent
      if (!messaged) interaction.followUp({ content: "❌ There was an issue adding to your wish list. Please try again." });
      return;
    }

    // Update cache with new wish and wish count
    await Promise.all([WishCache.cache(interaction.user.id, wishDocument), WishCountCache.cache(wish.character, wish.series, characterDocument.wishCount)]);

    // Set embed color to green to indicate success
    embed.setColor(config.embedColor.green);
    this.collector.stop();

    // Send success message
    interaction.followUp({
      content: `✅ Successfully added **${formattedCharacter}** · ${formattedSeries} to your wish list!`,
    });
  }
}

module.exports = WishListAddButtonPages;
