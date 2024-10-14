const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const MapCache = require("@database/redis/cache/map");
const { chunkArray, formatLookupPage, getWishListEmoji } = require("@utils/string/formatPage");
const ButtonPages = require("@pagination/ButtonPages");

class WishListPages extends ButtonPages {
  constructor(interaction, pageData) {
    super(interaction);
    this.totalCharacters = pageData.length;

    // Split the list of cards into chunks of 10
    this.pageDataChunks = chunkArray(pageData, 10);
  }

  saveState() {
    return {
      pages: this.pages,
      index: this.index,
      totalCharacters: this.totalCharacters,
      pageDataChunks: this.pageDataChunks,
    };
  }

  loadState(prevState) {
    this.pages = prevState.pages;
    this.index = prevState.index;
    this.totalCharacters = prevState.totalCharacters;
    this.pageDataChunks = prevState.pageDataChunks;
  }

  /**
   * Helper function to create embeds for each page.
   *
   * @param {Array<Array>} pageDataChunks - An array of arrays, where each inner array contains string data to format.
   */
  async createPages(pageDataChunks = this.pageDataChunks) {
    const pages = [];

    for (let i = 0; i < pageDataChunks.length; i++) {
      const formattedPage = await formatLookupPage(pageDataChunks[i]);
      const first = (i * 10 + 1).toLocaleString();
      const last = (i * 10 + charChunks[i].length).toLocaleString();
      const total = this.numCharacterResults.toLocaleString();

      const embed = new EmbedBuilder()
        .setTitle(`Character Lookup`)
        .setDescription(formattedPage)
        .setFooter({
          text: `Showing series ${first}-${last} (${total} total)`,
        });
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

  async addComponents() {
    // Button row
    const ends = new ButtonBuilder().setCustomId("toggleEnds").setEmoji("↔️").setStyle(ButtonStyle.Secondary);
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    this.components["toggleEnds"] = ends;
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    this.toggleComponents();
    const buttonRow = new ActionRowBuilder().addComponents(ends, prev, next);
    this.messageComponents.push(buttonRow);

    // Select menu row
    await this.addSelectMenu();
  }

  async addSelectMenu() {
    const options = await Promise.all(
      this.pageDataChunks[this.index].map(async ({ character, series, wishCount }) => {
        const formattedCharacter = await MapCache.getFormattedCharacter(character);

        return new StringSelectMenuOptionBuilder()
          .setEmoji(getWishListEmoji(wishCount))
          .setLabel(formattedCharacter)
          .setValue(JSON.stringify({ character: character, series: series }));
      })
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("characterSelect")
      .setPlaceholder("Select a character")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options);
    this.components["characterSelect"] = selectMenu;
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
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
        await this.updatePageButtons(i);
        break;
      }
      case "viewPrev": {
        if (this.index > 0) {
          this.index--;
        }
        await this.updatePageButtons(i);
        break;
      }
      case "viewNext": {
        if (this.index < this.pages.length - 1) {
          this.index++;
        }
        await this.updatePageButtons(i);
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

  async updatePageButtons(i) {
    this.toggleComponents();

    this.messageComponents.pop();
    await this.addSelectMenu();

    // Update message
    i.message.edit({
      embeds: [this.pages[this.index]],
      components: this.messageComponents,
    });
  }

  async handleSelect(i, value) {
    // Implement in extended class
    await i.followUp("This feature is not implemented yet.");
  }
}

module.exports = WishListPages;
