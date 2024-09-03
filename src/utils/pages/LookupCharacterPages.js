const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder } = require("discord.js");
const ButtonPages = require("./ButtonPages");
const client = require("../../../bot");

class LookupCharacterPage extends ButtonPages {
  constructor(interaction, value, pages, index) {
    super(interaction);

    const selection = JSON.parse(value);
    this.character = selection.character;
    this.series = selection.series;

    // Save last lookup instance for "back" button
    this.lookupPages = pages; // List of page embeds
    this.lookupIndex = index; // Page number user was last
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
        .setTitle(`Character Lookup`)
        .setDescription(
          `Character: ${client.characterNameMap(this.character)}\n` +
            `Series: ${client.seriesNameMap(this.series)}\n` +
            `Set: \n` +
            `Rarity: \n` +
            `\n` +
            `Wish count: \n` +
            `Total generated: \n` +
            `Total destroyed: \n` +
            `Circulation: \n` +
            `Retention Rate: `
        )
        .setFooter({ text: `This character is in ${0 > 1 ? `0 sets` : `1 set`}` });
      pages.push(embed);
    }

    this.pages = pages;
    this.index = 0;
  }

  // Update disabled states of page buttons
  toggleComponents() {
    const ends = this.components["toggleEnds"];
    const prev = this.components["viewPrev"];
    const next = this.components["viewNext"];
    if (this.index === 0 && this.index === this.pages.length - 1) {
      ends.setDisabled(true);
    } else {
      ends.setDisabled(false);
    }
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
  }

  addComponents() {
    // Initialize components
    const back = new ButtonBuilder().setCustomId("backToLookup").setLabel("Back").setStyle(ButtonStyle.Danger);
    const ends = new ButtonBuilder().setCustomId("toggleEnds").setEmoji("↔️").setStyle(ButtonStyle.Secondary);
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    const zoomStats = new ButtonBuilder().setCustomId("zoom").setEmoji("🔎").setStyle(ButtonStyle.Secondary);
    this.components["backToLookup"] = back;
    this.components["toggleEnds"] = ends;
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    this.components["toggleZoomStats"] = zoomStats;
    this.toggleComponents();

    // Button row
    const buttonRow = new ActionRowBuilder().addComponents(back, ends, prev, next, zoomStats);
    this.messageComponents.push(buttonRow);

    // Select menu row
    this.addSelectMenu();
  }

  addSelectMenu() {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("setSelect")
      .setPlaceholder("Select a set")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        this.pageDataChunks[this.index].map(({ character, series, wishCount }) =>
          new StringSelectMenuOptionBuilder()
            .setEmoji(getWishListEmoji(wishCount))
            .setLabel(client.characterNameMap[character])
            .setValue(`${JSON.stringify({ character: character, series: series })}`)
        )
      );
    this.components["characterSelect"] = selectMenu;
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.messageComponents.push(selectRow);
  }

  async handleCollect(i) {
    await i.deferUpdate();

    switch (i.customId) {
      case "toggleEnds": {
        if (!this.isEnd) {
          this.index = this.pages.length - 1;
        } else {
          this.index = 0;
        }
        this.isEnd = !this.isEnd;
        this.updatePageButtons(i);
        break;
      }
      case "viewPrev": {
        if (this.index > 0) {
          this.index--;
        }
        this.updatePageButtons(i);
        break;
      }
      case "viewNext": {
        if (this.index < this.pages.length - 1) {
          this.index++;
        }
        this.updatePageButtons(i);
        break;
      }
      case "characterSelect": {
        const selectedValue = i.values[0];
        await this.handleSelect(i, selectedValue);
        break;
      }
      default:
        return;
    }

    this.collector.resetTimer();
  }
}
