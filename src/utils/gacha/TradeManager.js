const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const mongoose = require("mongoose");
const TradeProfile = require("../../models/TradeProfile");
const CollectionModel = require("../../database/mongodb/models/card/collection");
const InventoryModel = require("../../database/mongodb/models/user/inventory");
const config = require("../../config");
const Logger = require("../Logger");
const logger = new Logger("Trade manager");

/**
 * State machine:
 * - AWAITING_REQUEST: Waiting for receiver to accept or reject trade request
 * - AWAITING_LOCK: Waiting for both players to lock in their trade offers
 * - AWAITING_CONFIRM: Waiting for both players to confirm trade
 * - TRADE_COMPLETE: Trade is complete
 * - TRADE_EXPIRED: Trade request expired
 * - TRADE_CANCELLED: Trade was cancelled
 * - TRANSACTION_ERROR: Trade transaction failed
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

    // Set when the trade request is accepted
    this.expirationUnix; // Unix time in seconds

    this.initButtons();
  }

  /**
   * Initializes the buttons for the trade manager.
   */
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

  /**
   * Initiates the trade request.
   */
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
    this.collector.on("end", (collected, reason) => this.handleEnd(message, reason));
  }

  /**
   * Handles the button interactions for the trade manager.
   * @param {Interaction} i - The interaction object from Discord.js.
   */
  async handleCollect(i) {
    switch (i.customId) {
      case "cancel":
        await i.deferUpdate();
        // At any point during the trade, either player can cancel the trade
        this.state = "TRADE_CANCELLED";
        this.collector.stop();
        break;
      case "accept": {
        await i.deferUpdate();
        if (this.state !== "AWAITING_REQUEST") break;

        // Receiver accepted trade request
        if (i.user.id === this.receiver.user.id) {
          this.state = "AWAITING_LOCK";

          // Set timeout to 3 minutes
          const timeoutDuration = 3 * 60 * 1000; // 3 minutes in milliseconds
          this.expirationUnix = Math.floor((Date.now() + timeoutDuration) / 1000);
          this.collector.resetTimer({ time: timeoutDuration });

          this.updateComponents();
          await Promise.all([this.requester.fetchDocuments(), this.receiver.fetchDocuments()]);
          await this.publishTradeEmbeds();
        }
        break;
      }
      case "offer": {
        if (this.state !== "AWAITING_LOCK") {
          await i.deferUpdate();
          break;
        }

        // That player is already locked in and cannot edit their offer
        if (this.isLocked.has(i.user.id)) {
          await i.deferUpdate();
          i.followUp({ content: "🔒 You cannot edit your offer after locking in.", ephemeral: true });
          break;
        }

        // Modal cannot be replied or deferred prior to the interaction
        await this.showOfferModal(i);
        break;
      }
      case "lock": {
        await i.deferUpdate();
        if (this.state !== "AWAITING_LOCK") break;

        // That player is already locked in
        if (this.isLocked.has(i.user.id)) {
          i.followUp({ content: "🔒 You are already locked in.", ephemeral: true });
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
        await i.deferUpdate();
        if (this.state !== "AWAITING_CONFIRM") break;

        // That player is already confirmed
        if (this.isConfirmed.has(i.user.id)) {
          i.followUp({ content: "✅ You are already confirmed.", ephemeral: true });
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
          this.collector.stop();
        }
        break;
      }
    }
  }

  /**
   * Handles the end of the trade session.
   * Updates message content, embed color, and removes action row.
   * @param {Message} message - The Discord message object to be updated.
   * @param {String} reason - The reason for ending the trade from the collector.
   */
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
      case "TRANSACTION_ERROR":
        msg.edit({
          content: `Error completing trade. (${this.requester.user} ${this.receiver.user})`,
          embeds: this.setColorToEmbeds(msg.embeds, config.embedColor.red),
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

  /**
   * Publishes the trade embeds for both the requester and the receiver.
   */
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

    await this.interaction.editReply({
      content:
        `Press the 📝 to enter/edit your trade, a list of \`card-code\` or \`quantity item-code\`, separated by commas.\n` +
        `**Both players must lock in and confirm to complete the trade.**\n` +
        `*Trade session expires <t:${this.expirationUnix}:R>.*`,
      embeds: [reqEmbed, recEmbed],
      components: this.actionRows,
    });
  }

  /**
   * Conducts trade transaction between the requester and the receiver.
   */
  async processTrade() {
    const req = this.requester;
    const rec = this.receiver;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Fetch both user collections and inventories
      const reqCollection = await CollectionModel.findOne({ userId: req.user.id }).session(session);
      const recCollection = await CollectionModel.findOne({ userId: rec.user.id }).session(session);
      const reqInventory = await InventoryModel.findOne({ userId: req.user.id }).session(session);
      const recInventory = await InventoryModel.findOne({ userId: rec.user.id }).session(session);

      if (!reqCollection || !recCollection || !reqInventory || !recInventory) {
        throw new Error("One or both user collections or inventories not found.");
      }

      // Fetch card document IDs for the valid cards
      const [reqCardIds, recCardIds] = await Promise.all([req.getValidCardIds(), rec.getValidCardIds()]);

      // Remove card IDs from both user collections
      reqCollection.cardsOwned = this.filterCardIds(reqCollection.cardsOwned, new Set(reqCardIds));
      recCollection.cardsOwned = this.filterCardIds(recCollection.cardsOwned, new Set(recCardIds));

      // Add card IDs to both user collections
      reqCollection.cardsOwned.push(...recCardIds);
      recCollection.cardsOwned.push(...reqCardIds);

      // Transfer items between inventories
      this.transferItems(reqInventory.inventory, recInventory.inventory, req.validItems);
      this.transferItems(recInventory.inventory, reqInventory.inventory, rec.validItems);

      // Save both collections and inventories
      await Promise.all([reqCollection.save({ session }), recCollection.save({ session }), reqInventory.save({ session }), recInventory.save({ session })]);

      await session.commitTransaction();
      this.state = "TRADE_COMPLETE";
    } catch (error) {
      await session.abortTransaction();
      this.state = "TRANSACTION_ERROR";
      logger.error("Transaction aborted due to error:", error.stack);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Retrieves the trade profile for a given user ID.
   * @param {String} userId - The ID of the user whose trade profile is to be retrieved.
   * @returns {TradeProfile} Returns the trade profile object if the user is either the requester or the receiver, otherwise returns null.
   */
  getTradeProfile(userId) {
    if (this.requester.user.id === userId) {
      return this.requester;
    } else if (this.receiver.user.id === userId) {
      return this.receiver;
    } else {
      return null;
    }
  }

  /**
   * Filters out card IDs from a collection and returns the updated collection.
   * @param {Array} cardsOwned - The array of card IDs owned by the user.
   * @param {Set} cardIdsToRemove - A set of card IDs to be removed.
   * @returns {Array} The updated array of card IDs.
   */
  filterCardIds(cardsOwned, cardIdsToRemove) {
    if (cardIdsToRemove.size === 0) return cardsOwned;

    const newCardsOwned = [];
    let removedCount = 0;

    for (const cardId of cardsOwned) {
      if (!cardIdsToRemove.has(cardId)) {
        newCardsOwned.push(cardId);
      } else {
        removedCount++;
        if (removedCount === cardIdsToRemove.size) {
          // Add the remaining cards and break the loop
          newCardsOwned.push(...cardsOwned.slice(cardsOwned.indexOf(cardId) + 1));
          break;
        }
      }
    }

    return newCardsOwned;
  }

  /**
   * Transfers items from one inventory to another.
   * @param {Map} fromInventory - The inventory to transfer items from.
   * @param {Map} toInventory - The inventory to transfer items to.
   * @param {Array} items The array of items to transfer.
   */
  transferItems(fromInventory, toInventory, items) {
    items.forEach(({ itemName, quantity }) => {
      // Remove from the source inventory
      const currentCount = fromInventory.get(itemName);
      const newCount = currentCount - quantity;
      if (newCount === 0) {
        fromInventory.delete(itemName);
      } else {
        fromInventory.set(itemName, newCount);
      }

      // Add to the destination inventory
      const otherCount = toInventory.get(itemName) || 0;
      toInventory.set(itemName, otherCount + quantity);
    });
  }

  /**
   * Displays a modal for the user to enter their trade offer.
   * @param {ButtonInteraction} interaction - The interaction object from Discord.js.
   */
  async showOfferModal(interaction) {
    const profile = this.getTradeProfile(interaction.user.id);

    // Create modal
    const offerInput = new TextInputBuilder()
      .setCustomId("offerInput")
      .setLabel("Enter your trade offer")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(`Enter a list of "card-code" or "quantity item-code", separated by commas.`)
      .setValue(profile.offerInput.join(", "));
    const actionRow = new ActionRowBuilder().addComponents(offerInput);
    const modal = new ModalBuilder().setCustomId("tradeOfferModal").setTitle("Submit Trade Offer").addComponents(actionRow);

    // Show and collect modal
    await interaction.showModal(modal);
    try {
      const submitted = await interaction.awaitModalSubmit({
        filter: (i) => i.customId === "tradeOfferModal",
        time: 60_000,
      });

      await profile.processOffer(submitted);
      await this.publishTradeEmbeds();
    } catch (error) {
      logger.error(error.stack);
    }
  }

  /**
   * Changes the color of the embeds.
   * @param {Embed} embeds - Array of Embed.
   * @param {String} color - HEX code for the color.
   * @returns Array of Embed with the updated color.
   */
  setColorToEmbeds(embeds, color) {
    return embeds.map((embed) => {
      const temp = new EmbedBuilder(embed);
      temp.setColor(color);
      return temp;
    });
  }

  /**
   * Updates the action row components based on current state.
   * Still need to publish the updated message.
   */
  updateComponents() {
    switch (this.state) {
      case "AWAITING_REQUEST":
        this.actionRows = [new ActionRowBuilder().addComponents(this.components["cancel"], this.components["accept"])];
        break;
      case "AWAITING_LOCK":
        this.actionRows = [new ActionRowBuilder().addComponents(this.components["cancel"], this.components["offer"], this.components["lock"])];
        break;
      case "AWAITING_CONFIRM":
        this.actionRows = [
          new ActionRowBuilder().addComponents(this.components["cancel"], this.components["offer"], this.components["lock"], this.components["confirm"]),
        ];
        break;
      default:
        this.actionRows = [];
    }
  }
}

module.exports = TradeManager;
