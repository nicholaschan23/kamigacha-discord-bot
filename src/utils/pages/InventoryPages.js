const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { chunkArray, formatInventoryPage } = require("../string/formatPage");
const { capitalizeFirstLetter } = require("../string/format");
const ButtonPages = require("./ButtonPages");
const config = require("@config");
const Item = require("@models/Item");
const { sortItemList } = require("@utils/gacha/calculateRipValue");

class InventoryPages extends ButtonPages {
  constructor(interaction, inventoryDocument) {
    super(interaction, [], inventoryDocument.isPrivate);
    this.inventoryDocument = inventoryDocument;
    this.inventory;

    this.init();
    this.pages = this.createPages();
  }

  init() {
    const inventoryArray = [];
    const parsedTypes = new Set(); // Empty set to store parsed item types
    const typeOrder = Object.keys(config.itemTypes);

    for (const [name, quantity] of this.inventoryDocument.inventory) {
      const itemType = config.itemsMap.get(name)?.type;
      inventoryArray.push(new Item(name, quantity, itemType));
      parsedTypes.add(itemType);
    }

    this.inventory = sortItemList(inventoryArray);

    // Filter item types to only those present in the inventory
    this.itemTypes = typeOrder.filter((type) => parsedTypes.has(type));
  }

  createPages(itemType = []) {
    // Start on first page
    this.index = 0;

    // Filter inventory
    let filteredInventory = [...this.inventory];
    if (itemType.length > 0 && itemType.length < this.itemTypes.length) {
      filteredInventory = filteredInventory.filter(({ name, quantity, type }) => {
        return itemType.includes(type);
      });
    }

    // Chunk data to make content for pages
    const dataChunks = chunkArray(filteredInventory, 10);

    // Create embed
    const pages = [];
    if (filteredInventory.length === 0) {
      const embed = new EmbedBuilder().setTitle(`Inventory`).setDescription(`Items carried by <@${this.inventoryDocument.userId}>`).setFooter({
        text: `Showing items 0-0 (0 total)`,
      });
      pages.push(embed);
    } else {
      for (let i = 0; i < dataChunks.length; i++) {
        const embed = new EmbedBuilder()
          .setTitle(`Inventory`)
          .setDescription(`Items carried by <@${this.inventoryDocument.userId}>\n\n` + formatInventoryPage(dataChunks[i]))
          .setFooter({
            text: `Showing items ${(i * 10 + 1).toLocaleString()}-${(
              i * 10 +
              dataChunks[i].length
            ).toLocaleString()} (${filteredInventory.length.toLocaleString()} total)`,
          });
        pages.push(embed);
      }
    }
    return pages;
  }

  addComponents() {
    // Button row
    const ends = new ButtonBuilder().setCustomId("toggleEnds").setEmoji("↔️").setStyle(ButtonStyle.Secondary);
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    this.components["toggleEnds"] = ends;
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    const buttonRow = new ActionRowBuilder().addComponents(ends, prev, next);
    this.messageComponents.push(buttonRow);
    this.updateComponents();

    // Select menu row
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("inventoryFilters")
      .setPlaceholder("Select filters")
      .setMinValues(1)
      .setMaxValues(this.itemTypes.length)
      .addOptions(
        this.itemTypes.map((type) => {
          const emoji = config.itemTypes[type].icon;
          const label = capitalizeFirstLetter(type);
          const value = type;
          return new StringSelectMenuOptionBuilder().setEmoji(emoji).setLabel(label).setValue(value);
        })
      );
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.components["inventoryFilters"] = selectMenu;
    this.messageComponents.push(selectRow);
  }

  async handleCollect(i) {
    await i.deferUpdate();

    switch (i.customId) {
      case "toggleEnds": {
        const last = this.pages.length - 1;
        if (this.index === 0 || this.index < last / 2) {
          this.index = last;
        } else {
          this.index = 0;
        }
        break;
      }
      case "viewPrev": {
        if (this.index > 0) {
          this.index--;
        }
        break;
      }
      case "viewNext": {
        if (this.index < this.pages.length - 1) {
          this.index++;
        }
        break;
      }
      case "inventoryFilters": {
        const selectedValues = i.values;
        this.pages = this.createPages(selectedValues);
        break;
      }
      default:
        return;
    }

    this.updateComponents();

    // Update message
    if (this.ephemeral) {
      this.interaction.editReply({
        embeds: [this.pages[this.index]],
        components: this.messageComponents,
        fetchReply: true,
      });
    } else {
      i.message.edit({
        embeds: [this.pages[this.index]],
        components: this.messageComponents,
      });
    }

    this.collector.resetTimer();
  }

  updateComponents() {
    // Update disabled states of page buttons
    const ends = this.components["toggleEnds"];
    const prev = this.components["viewPrev"];
    const next = this.components["viewNext"];
    if (this.index === 0) {
      prev.setDisabled(true);
    } else {
      prev.setDisabled(false);
    }
    if (this.index === this.pages.length - 1) {
      next.setDisabled(true);
    } else {
      next.setDisabled(false);
    }
    if (this.index === 0 && this.index === this.pages.length - 1) {
      ends.setDisabled(true);
    } else {
      ends.setDisabled(false);
    }
  }
}

module.exports = InventoryPages;
