const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { isValidCode } = require("../../utils/string/validation");
const TradeProfile = require("../../models/TradeProfile");
const CardModel = require("../../database/mongodb/models/card/card");
const config = require("../../config");

/**
 * State machine:
 * - AWAITING_REQUEST: Waiting for receiver to accept or reject trade request
 * - AWAITING_LOCK: Waiting for both players to lock in their trade offers
 * - AWAITING_CONFIRM: Waiting for both players to confirm trade
 * - TRADE_COMPLETE: Trade is complete
 * - TRADE_EXPIRED: Trade request expired
 * - TRADE_CANCELLED: Trade was cancelled
 */
class TradeManager {
  constructor(interaction, receiver) {
    this.interaction = interaction;

    // Initialize trade profiles
    this.requester = new TradeProfile(interaction.user)
    this.receiver = new TradeProfile(receiver)

    // Keep track of trade offer
    this[`offer${this.userA.id}`] = {
      input: [], // Array of tokens
      validCards: new Map(), // Map of valid cards
      validItems: new Map(), // Map of valid items
    };
    this[`offer${this.userB.id}`] = {
      input: [],
      validCards: new Map(),
      validItems: new Map(),
    };

    // this[`offerInput${this.userA.id}`] = [];
    // this[`offerInput${this.userB.id}`] = [];
    // this[`offerCards${this.userA.id}`] = [];
    // this[`offerCards${this.userB.id}`] = [];
    // this[`offerInventory${this.userA.id}`] = [];
    // this[`offerInventory${this.userB.id}`] = [];

    this.locked = new Set(); // Keep track of locked players
    this.confirmed = new Set(); // Keep track of confirmed players

    // Message components
    this.components = {}; // { customId: component }
    this.actionRows = []; // Action rows have message components
    this.collector; // Component collector

    this.initButtons();
  }

  async initButtons() {
    const cancelButton = new ButtonBuilder().setCustomId("cancel").setEmoji("❌").setStyle(ButtonStyle.Secondary);
    const acceptButton = new ButtonBuilder().setCustomId("accept").setEmoji("☑️").setStyle(ButtonStyle.Secondary);
    const offerButton = new ButtonBuilder().setCustomId("offer").setEmoji("📝").setStyle(ButtonStyle.Secondary);
    const lockButton = new ButtonBuilder().setCustomId("lock").setEmoji("🔒").setStyle(ButtonStyle.Secondary);
    const confirmButton = new ButtonBuilder().setCustomId("confirm").setEmoji("✅").setStyle(ButtonStyle.Secondary);
    this.components["accept"] = acceptButton;
    this.components["cancel"] = cancelButton;
    this.components["offer"] = offerButton;
    this.components["lock"] = lockButton;
    this.components["confirm"] = confirmButton;
  }

  async initTrade() {
    this.state = "AWAITING_REQUEST";

    // Embed
    const embed = new EmbedBuilder().setTitle("Trade Request").setDescription(`${this.userB}, please accept or decline the trade request from ${this.userA}.`).setColor(config.embedColor.yellow);
    const actionRow = new ActionRowBuilder().addComponents(this.components["cancel"], this.components["accept"]);
    this.actionRows.push(actionRow);

    // Send message
    const message = await this.interaction.reply({
      content: `${this.userB}, would you like to trade with ${this.userA}?`,
      embeds: [embed],
      components: this.actionRows,
      fetchReply: true,
    });

    // Initialize component collector
    this.collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === this.userA.id || i.user.id === this.userB.id,
      time: 60_000,
    });
    this.collector.on("collect", this.handleCollect.bind(this));
    this.collector.on("end", this.handleEnd.bind(this, message));
  }

  async fetchDocuments() {
    // Populate user's card collections and inventories in parallel
    const [collectionA, collectionB, inventoryA, inventoryB] = await Promise.all([
      CollectionModel().findOne({ userId: this.userA.id }).populate("cardsOwned"),
      CollectionModel().findOne({ userId: this.userB.id }).populate("cardsOwned"),
      InventoryModel().findOne({ userId: this.userA.id }),
      InventoryModel().findOne({ userId: this.userB.id }),
    ]);

    this[`inventory${this.userA.id}`] = {
      collection: collectionA,
      inventory: inventoryA,
    };
    this[`inventory${this.userB.id}`] = {
      collection: collectionB,
      inventory: inventoryB,
    };
    // this[`collection${this.userA.id}`] = collectionA;
    // this[`collection${this.userB.id}`] = collectionB;
    // this[`inventory${this.userA.id}`] = inventoryA;
    // this[`inventory${this.userB.id}`] = inventoryB;
  }

  async publishTradeEmbeds() {
    const offerA = [...this[`offerCards${this.userA.id}`], ...this[`offerInventory${this.userA.id}`]].join(", ");
    const embedA = new EmbedBuilder()
      .setTitle(`${this.userA.username}`)
      .setDescription(`\`\`\`${offerA || "No offer yet"}\`\`\``)
      .setColor(0x00ae86)
      .setThumbnail(this.userA.displayAvatarURL());

    const offerB = [...this[`offerCards${this.userB.id}`], ...this[`offerInventory${this.userB.id}`]].join(", ");
    const embedB = new EmbedBuilder()
      .setTitle(`${this.userB.username}`)
      .setDescription(`\`\`\`${offerB || "No offer yet"}\`\`\``)
      .setColor(0x00ae86)
      .setThumbnail(this.userB.displayAvatarURL());

    await this.updateMessage({
      content: `Press the 📝 to enter/edit your trade. Both players must lock in to complete the trade.`,
      embeds: [embedA, embedB],
      components: this.actionRows,
    });
  }

  async handleCollect(i) {
    await i.deferUpdate();

    switch (i.customId) {
      case "cancel":
        // At any point during the trade, either player can cancel the trade
        this.state = "TRADE_CANCELLED";
        this.collector.stop();
        break;
      case "accept": {
        if (this.state !== "AWAITING_REQUEST") break;

        // Receiver accepted trade request
        if (i.user.id === this.userB.id) {
          this.state = "AWAITING_LOCK";
          this.actionRows = [new ActionRowBuilder().addComponents(this.components["reject"], this.components["offer"], this.components["lock"])];
          this.collector.resetTimer({ time: 3 * 60_000 }); // Set timeout to 3 minutes
          await this.fetchDocuments();
          await this.publishTradeEmbeds();
        }
        break;
      }
      case "offer": {
        if (this.state !== "AWAITING_LOCK") break;

        // That player is already locked in and cannot edit their offer
        if (this.locked.has(i.user.id)) {
          i.followUp({ content: "You cannot edit your offer after locking in.", ephemeral: true });
          break;
        }

        await this.showOfferModal(i);
        break;
      }
      case "lock": {
        if (this.state !== "AWAITING_LOCK") break;

        // That player is already locked in
        if (this.locked.has(i.user.id)) {
          i.followUp({ content: "You are already locked in.", ephemeral: true });
          break;
        }

        // Lock in player
        this.locked.add(i.user.id);
        if (this.locked.size === 1) {
          this.components["lock"].setStyle(ButtonStyle.Primary);
        } else if (this.locked.size === 2) {
          this.state = "AWAITING_CONFIRM";
          this.components["offer"].setDisabled(true);
          this.components["lock"].setDisabled(true);
          this.actionRows[0].addComponents(this.components["confirm"]);
          await this.publishTradeEmbeds();
        }
        break;
      }
      case "confirm": {
        if (this.state !== "AWAITING_CONFIRM") break;

        // That player is already confirmed
        if (this.confirmed.has(i.user.id)) {
          i.followUp({ content: "You are already confirmed.", ephemeral: true });
          break;
        }

        this.confirmed.add(i.user.id);
        if (this.confirmed.size === 1) {
          this.components["confirm"].setStyle(ButtonStyle.Primary);
        } else if (this.confirmed.size === 2) {
          await this.processTrade();
          this.state = "TRADE_COMPLETE";
          this.collector.stop();
        }
        break;
      }
    }
  }

  async showOfferModal(interaction) {
    const userId = interaction.user.id;

    const offerInput = new TextInputBuilder()
      .setCustomId("offerInput")
      .setLabel("Enter your trade offer")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Type a quantity (if multiple items) followed by the code to add items or cards to the trade. Separate entries with commas. Click submit when finished. Both sides must lock in before proceeding to the next step.");

    // Load a previous offer input if it exists
    const prevOffer = this[`offerInput${userId}`];
    if (prevOffer.length > 0) {
      offerInput.setValue(prevOffer.join(", "));
    }

    const actionRow = new ActionRowBuilder().addComponents(offerInput);
    const modal = new ModalBuilder().setCustomId("tradeOfferModal").setTitle("Submit Trade Offer").addComponents(actionRow);

    await interaction.showModal(modal);

    const submitted = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === "tradeOfferModal",
      time: 60_000,
    });

    await this.processOffer(interaction.user.id, submitted);
    await this.updateTradeEmbeds();
  }

  // await modal.followUp({ content: "Trade offer submitted!", components: [] });
  async processOffer(userId, modal) {
    // Save the offer input as an array
    this[`offer${userId}`].input = modal.fields
      .getTextInputValue("offerInput")
      .split(",")
      .map((item) => item.trim());

    // Output errors for player feedback
    const errors = {
      invalidCode: [],
      notOwnedCode: [],
      invalidItem: [],
      notOwnedItem: [],
    };

    /**
     * If the token has no spaces, it's a card code.
     * Else, split the token by spaces and check if the first token is a number.
     * If the first token is a number, it's a quantity followed by an item.
     * If the first token is not a number, it's default a quantity of 1.
     */
    const offerInput = this[`offer${userId}`].input;
    const offerCards = [];
    const offerInventory = [];
    for (const token of offerInput) {
      const tokenArray = token.split(" ");

      if (tokenArray.length === 1) {
        const code = tokenArray[0];

        // Check if code is valid
        if (!isValidCode(code)) {
          errors.invalidCode.push(code);
          continue;
        }

        // Check if card code exists
        const cardDocument = await CardModel().findOne({ code: code });
        if (!cardDocument) {
          errors.invalidCode.push(code);
          continue;
        }

        // Check if card is owned by player
        const collection = this[`collection${userId}`];
        const cardOwned = collection.cardsOwned.some((card) => card.code === code);
        if (!cardOwned) {
          errors.notOwnedCode.push(code);
          continue;
        }

        // Add the offer to the trade
        offerCards.push(code);
      } else {
        let quantity = tokenArray[0];
        let itemName;

        // Parse quantity and item name
        if (isNaN(quantity)) {
          quantity = 1; // Default quantity
          itemName = tokenArray.join(" ");
        } else {
          quantity = Math.abs(parseInt(quantity));
          itemName = tokenArray.slice(1).join(" ");
        }

        // Check if item exists
        const itemExists = config.items.includes(itemName);
        if (!itemExists) {
          errors.invalidItem.push(itemName);
          continue;
        }

        // Check if player has the item and available quantity
        const inventory = this[`inventory${userId}`];
        const hasItem = inventory.items.some((item) => item.name === itemName && item.quantity >= quantity);
        if (!hasItem) {
          errors.notOwnedItem.push({ quantity, itemName });
          continue;
        }

        // Add the offer to the trade
        offerInventory.push({ quantity, itemName });
      }
    }

    // Check for errors and send feedback
    const errorMessages = [];
    if (errors.invalidCode.length > 0) {
      errorMessages.push(`Invalid card code: ${errors.invalidCode.map((code) => `\`${code}\``).join(", ")}`);
    }
    if (errors.notOwnedCode.length > 0) {
      errorMessages.push(`You do not own these cards: ${errors.notOwnedCode.map((code) => `\`${code}\``).join(", ")}`);
    }
    if (errors.invalidItem.length > 0) {
      errorMessages.push(`Invalid item: ${errors.invalidItem.map((item) => `\`${item}\``).join(", ")}`);
    }
    if (errors.notOwnedItem.length > 0) {
      errorMessages.push(`You do not own these items: ${errors.notOwnedItem.map((item) => `\`${item.quantity} ${item.itemName}\``).join(", ")}`);
    }

    if (errorMessages.length > 0) {
      await modal.followUp({ content: `${errorMessages.join("\n")}`, ephemeral: true });
    } else {
      await modal.followUp({ content: "Trade offer submitted successfully!", ephemeral: true });
    }
  }

  async processTrade() {
    // Re-verify all 

  }

  handleEnd(message, reason) {
    console.log(message, reason);
    if (reason === "time") {
      this.state = "TRADE_EXPIRED";
    }

    switch (this.state) {
      case "TRADE_EXPIRED":
        message.edit({
          content: `Trade request expired between ${this.userA} and ${this.userB}.`,
          embeds: this.setColorToEmbeds(message.embeds, config.embedColor.red),
          components: [],
        });
        return;
      case "TRADE_CANCELLED":
        message.edit({
          content: `Trade cancelled between ${this.userA} and ${this.userB}.`,
          embeds: this.setColorToEmbeds(message.embeds, config.embedColor.red),
          components: [],
        });
        break;
      case "TRADE_COMPLETE":
        message.edit({
          content: "Trade complete.",
          embeds: this.setColorToEmbeds(message.embeds, config.embedColor.green),
          components: [],
        });
        break;
      default:
        message.edit({
          embeds: this.setColorToEmbeds(message.embeds, config.embedColor.red),
          components: [],
        });
    }
  }

  setColorToEmbeds(embeds, color) {
    return embeds.map((embed) => {
      const temp = new EmbedBuilder(embed);
      temp.setColor(color);
      return temp;
    });
  }

  async updateMessage({ content, embeds, components }) {
    await this.interaction.editReply({
      content,
      embeds,
      components,
    });
  }
}

module.exports = TradeManager;
