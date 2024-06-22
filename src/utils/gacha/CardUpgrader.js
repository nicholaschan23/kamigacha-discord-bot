const CardModel = require("../../database/mongodb/models/card/card");
const CollectionModel = require("../../database/mongodb/models/card/collection");

class CardUpgrader {
  constructor(client, queriedCards) {
    this.client = client;
    this.userID = queriedCards[0].ownerID;
    this.queriedCards = queriedCards;
  }

  async upgradeCards(cardCodes) {
    try {
      // Check if the user owns all 10 cards
      const ownedCards = await CardModel(this.client).find({
        code: { $in: cardCodes },
        ownerID: this.userID,
      });
      if (ownedCards.length !== 10) {
        throw new Error("You do not own all 10 specified cards.");
      }

      // Remove these cards from the user's collection
      const deleteResult = await Collection.updateOne({ userID: this.userID }, { $pull: { cardsOwned: { $in: cardCodes } } });
      if (deleteResult.nModified !== 10) {
        throw new Error("Failed to remove cards from the user's collection.");
      }

      // Delete the cards from the Card collection
      await Card.deleteMany({ _id: { $in: cardCodes } });

      // Implement your logic to determine the new card to create
      const newCard = this.calculateNewCard(ownedCards);

      // Create the new card
      const createdCard = await Card.create(newCard);

      // Add the new card to the user's collection
      await Collection.updateOne({ userID: this.userID }, { $addToSet: { cardsOwned: createdCard._id } });

      return createdCard;
    } catch (error) {
      console.error("Error upgrading cards:", error);
      throw error;
    }
  }

  calculateNewCard(ownedCards) {
    // Implement your logic to determine the new card based on the 10 owned cards
    // This is where you calculate the new card attributes based on % chances or other criteria
    // Example logic:
    const newCard = {
      code: "newCardCode", // Replace with actual code generation logic
      rarity: "UR", // Example, replace with calculated rarity
      set: "New Set", // Example, replace with calculated set
      series: "New Series", // Example, replace with calculated series
      character: "New Character", // Example, replace with calculated character
      ownerID: this.userID,
      guildID: "guildID", // Replace with actual guild ID if needed
      image: "newCardImage", // Replace with actual image URL
    };

    return newCard;
  }
}

module.exports = CardUpgrader;
