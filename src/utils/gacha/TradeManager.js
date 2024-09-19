const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { isValidCode } = require("../../utils/string/validation");
const TradeProfile = require("../../models/TradeProfile");
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
    this.requester = new TradeProfile(interaction.user);
    this.receiver = new TradeProfile(receiver);

    // Message components
    this.components = {}; // { customId: component }
    this.actionRows = []; // Action rows have message components
    this.collector; // Component collector

    // Trade status
    this.isLocked = new Set();
    this.isConfirmed = new Set();

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
    const embed = new EmbedBuilder()
      .setTitle("Trade Request")
      .setDescription(`${this.receiver.user}, please accept or decline the trade request from ${this.requester.user}.`)
      .setColor(config.embedColor.yellow);
    const actionRow = new ActionRowBuilder().addComponents(this.components["cancel"], this.components["accept"]);
    this.actionRows.push(actionRow);

    // Send message
    const message = await this.interaction.reply({
      content: `${this.receiver.user}, would you like to trade with ${this.requester.user}?`,
      embeds: [embed],
      components: this.actionRows,
      fetchReply: true,
    });

    // Initialize component collector
    this.collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === this.requester.user.id || i.user.id === this.receiver.user.id,
      time: 60_000,
    });
    this.collector.on("collect", this.handleCollect.bind(this));
    this.collector.on("end", this.handleEnd.bind(this, message));
  }

  async publishTradeEmbeds() {
    const createEmbed = (user, lockStatus, offer) => {
      return new EmbedBuilder()
        .setTitle(user.username)
        .setDescription(`\`\`\`ansi\n${lockStatus}\n${offer}\`\`\``)
        .setColor(config.embedColor.yellow)
        .setThumbnail(user.displayAvatarURL());
    };

    const req = this.requester;
    const rec = this.receiver;

    const reqLockStatus = this.isLocked.has(req.user.id) ? "\u001b[1;32mLocked\u001b[0m" : "\u001b[1;31mNot Ready\u001b[0m";
    const recLockStatus = this.isLocked.has(rec.user.id) ? "\u001b[1;32mLocked\u001b[0m" : "\u001b[1;31mNot Ready\u001b[0m";

    const reqEmbed = createEmbed(req.user, reqLockStatus, req.offer);
    const recEmbed = createEmbed(rec.user, recLockStatus, rec.offer);

    await this.updateMessage({
      content: `Press the 📝 to enter/edit your trade. Both players must lock in to complete the trade.`,
      embeds: [reqEmbed, recEmbed],
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
        if (i.user.id === this.receiver.user.id) {
          this.state = "AWAITING_LOCK";
          this.collector.resetTimer({ time: 3 * 60_000 }); // Set timeout to 3 minutes
          this.updateComponents();
          await Promise.all([this.requester.fetchDocuments(), this.receiver.fetchDocuments()]);
          await this.publishTradeEmbeds();
        }
        break;
      }
      case "offer": {
        if (this.state !== "AWAITING_LOCK") break;

        // That player is already locked in and cannot edit their offer
        if (this.isLocked.has(i.user.id)) {
          i.followUp({ content: "You cannot edit your offer after locking in.", ephemeral: true });
          break;
        }

        await this.showOfferModal(i);
        break;
      }
      case "lock": {
        if (this.state !== "AWAITING_LOCK") break;

        // That player is already locked in
        if (this.isLocked.has(i.user.id)) {
          i.followUp({ content: "You are already locked in.", ephemeral: true });
          break;
        }

        // Lock in player
        this.isLocked.add(i.user.id);
        if (this.isLocked.size === 1) {
          this.components["lock"].setStyle(ButtonStyle.Primary);
          this.updateComponents();
          await this.publishTradeEmbeds();
        } else if (this.isLocked.size === 2) {
          this.state = "AWAITING_CONFIRM";
          this.components["offer"].setDisabled(true);
          this.components["lock"].setDisabled(true);
          this.updateComponents();
          await this.publishTradeEmbeds();
        }
        break;
      }
      case "confirm": {
        if (this.state !== "AWAITING_CONFIRM") break;

        // That player is already confirmed
        if (this.isConfirmed.has(i.user.id)) {
          i.followUp({ content: "You are already confirmed.", ephemeral: true });
          break;
        }

        this.isConfirmed.add(i.user.id);
        if (this.isConfirmed.size === 1) {
          this.components["confirm"].setStyle(ButtonStyle.Primary);
          this.updateComponents();
          await i.editReply({
            components: this.actionRows,
          });
        } else if (this.isConfirmed.size === 2) {
          await this.processTrade();
          this.state = "TRADE_COMPLETE";
          this.collector.stop();
        }
        break;
      }
    }
  }

  async showOfferModal(interaction) {
    const profile = this.getTradeProfile(interaction.user.id);

    const offerInput = new TextInputBuilder()
      .setCustomId("offerInput")
      .setLabel("Enter your trade offer")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(
        "Type a quantity (if multiple items) followed by the code to add items or cards to the trade. Separate entries with commas. Click submit when finished. Both sides must lock in before proceeding to the next step."
      )
      .setValue(profile.offerInput.join(", "));

    const actionRow = new ActionRowBuilder().addComponents(offerInput);
    const modal = new ModalBuilder().setCustomId("tradeOfferModal").setTitle("Submit Trade Offer").addComponents(actionRow);

    await interaction.showModal(modal);

    const submitted = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === "tradeOfferModal",
      time: 60_000,
    });

    await this.processOffer(profile, submitted);
    await this.updateTradeEmbeds();
  }

  // await modal.followUp({ content: "Trade offer submitted!", components: [] });
  async processOffer(profile, modal) {
    // Save the offer input as an array
    profile.offerInput = modal.fields
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
    const offerCards = [];
    const offerInventory = [];
    for (const token of profile.offerInput) {
      const tokenArray = token.split(" ");

      if (tokenArray.length === 1) {
        const code = tokenArray[0];

        // Check if code is valid
        if (!isValidCode(code)) {
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

  async handleEnd(message, reason) {
    const msg = await message.fetch();

    if (reason === "time") {
      this.state = "TRADE_EXPIRED";
    }

    switch (this.state) {
      case "TRADE_EXPIRED":
        msg.edit({
          content: `Trade request expired. (${this.requester.user} ${this.receiver.user})`,
          embeds: this.setColorToEmbeds(msg.embeds, config.embedColor.red),
          components: [],
        });
        return;
      case "TRADE_CANCELLED":
        msg.edit({
          content: `Trade cancelled. (${this.requester.user} ${this.receiver.user})`,
          embeds: this.setColorToEmbeds(msg.embeds, config.embedColor.red),
          components: [],
        });
        break;
      case "TRADE_COMPLETE":
        msg.edit({
          content: `Trade complete! (${this.requester.user} ${this.receiver.user})`,
          embeds: this.setColorToEmbeds(msg.embeds, config.embedColor.green),
          components: [],
        });
        break;
      default:
        msg.edit({
          embeds: this.setColorToEmbeds(msg.embeds, config.embedColor.red),
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

  updateComponents() {
    switch (this.state) {
      case "AWAITING_REQUEST":
        this.actionRows = [new ActionRowBuilder().addComponents(this.components["cancel"], this.components["accept"])];
        break;
      case "AWAITING_LOCK":
        this.actionRows = [new ActionRowBuilder().addComponents(this.components["cancel"], this.components["offer"], this.components["lock"])];
        break;
      case "AWAITING_CONFIRM":
        this.actionRows = [new ActionRowBuilder().addComponents(
          this.components["cancel"],
          this.components["offer"],
          this.components["lock"],
          this.components["confirm"]
        )];
        break;
      case "TRADE_COMPLETE":
      case "TRADE_EXPIRED":
      case "TRADE_CANCELLED":
        this.actionRows = []; // No components for these states
        break;
      default:
        this.actionRows = []; // Default empty action row
    }
  }

  getTradeProfile(userId) {
    if (this.requester.user.id === userId) {
      return this.requester;
    } else if (this.receiver.user.id === userId) {
      return this.receiver;
    } else {
      return null;
    }
  }
}

module.exports = TradeManager;
