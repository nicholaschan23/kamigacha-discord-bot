const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const MapCache = require("@database/redis/cache/map");
const { chunkArray, formatLookupCharacterPage, formatLookupSeriesPage, getWishListEmoji } = require("@utils/string/formatPage");
const ButtonPages = require("@pagination/ButtonPages");
const LookupCharacterPages = require("./LookupCharacterPages");
const LookupSeriesPages = require("./LookupSeriesPages");

const MAX_PAGES = 50;
const CHUNK_SIZE = 10;

class LookupPages extends ButtonPages {
  constructor(interaction, characterResults, seriesResults) {
    super(interaction);

    // Split the list of cards into chunks
    this.characterResultChunks = chunkArray(characterResults, CHUNK_SIZE);
    this.seriesResultChunks = chunkArray(seriesResults, CHUNK_SIZE);

    this.messageComponents = [null, null];
  }

  saveState() {
    return {
      state: this.state,
      pages: this.pages,
      index: this.index,
      characterResultChunks: this.characterResultChunks,
      characterResultPages: this.characterResultPages,
      seriesResultChunks: this.seriesResultChunks,
      seriesResultPages: this.seriesResultPages,
    };
  }

  loadState(prevState) {
    this.state = prevState.state;
    this.pages = prevState.pages;
    this.index = prevState.index;
    this.characterResultChunks = prevState.characterResultChunks;
    this.characterResultPages = prevState.characterResultPages;
    this.seriesResultChunks = prevState.seriesResultChunks;
    this.seriesResultPages = prevState.seriesResultPages;
  }

  /**
   * Helper function to create embeds for each page.
   *
   * @param {Array<Array>} characterResultChunks - An array of arrays, where each inner array contains string data to format.
   */
  async createPages(
    charChunks = this.characterResultChunks,
    charPages = this.characterResultPages,
    seriesChunks = this.seriesResultChunks,
    seriesPages = this.seriesResultPages
  ) {
    charPages = [];

    for (let i = 0; i < Math.min(charChunks.length, MAX_PAGES); i++) {
      const formattedPage = await formatLookupCharacterPage(charChunks[i]);
      const first = (i * CHUNK_SIZE + 1).toLocaleString();
      const last = (i * CHUNK_SIZE + charChunks[i].length).toLocaleString();
      const total = charChunks.length > 0 ? ((charChunks.length - 1) * CHUNK_SIZE + charChunks[charChunks.length - 1].length).toLocaleString() : "0";

      const embed = new EmbedBuilder()
        .setTitle(`Character Lookup`)
        .setDescription(formattedPage + `${charChunks.length >= MAX_PAGES ? "\n-# If the character is not listed, please refine your search." : ""}`)
        .setFooter({
          text: `Showing characters ${first}-${last} (${total} total)`,
        });
      charPages.push(embed);
    }

    seriesPages = [];
    for (let i = 0; i < Math.min(seriesChunks.length, MAX_PAGES); i++) {
      const formattedPage = await formatLookupSeriesPage(seriesChunks[i]);
      const first = (i * CHUNK_SIZE + 1).toLocaleString();
      const last = (i * CHUNK_SIZE + seriesChunks[i].length).toLocaleString();
      const total = seriesChunks.length > 0 ? ((seriesChunks.length - 1) * CHUNK_SIZE + seriesChunks[seriesChunks.length - 1].length).toLocaleString() : "0";

      const embed = new EmbedBuilder()
        .setTitle(`Series Lookup`)
        .setDescription(formattedPage + `${seriesChunks.length >= MAX_PAGES ? "\n-# If the series is not listed, please refine your search." : ""}`)
        .setFooter({
          text: `Showing series ${first}-${last} (${total} total)`,
        });
      seriesPages.push(embed);
    }

    this.characterResultPages = charPages;
    this.seriesResultPages = seriesPages;

    this.state = "CHARACTER";
    this.pages = this.characterResultPages;
    this.index = 0;
  }

  // Update disabled states of page buttons
  updateComponents() {
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
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    const series = new ButtonBuilder().setCustomId("viewSeries").setEmoji("📒").setLabel("Series").setStyle(ButtonStyle.Secondary);
    const character = new ButtonBuilder().setCustomId("viewCharacter").setEmoji("📒").setLabel("Character").setStyle(ButtonStyle.Secondary);
    this.components["toggleEnds"] = ends;
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    this.components["viewSeries"] = series;
    this.components["viewCharacter"] = character;
    this.characterLookupRow = new ActionRowBuilder().addComponents(ends, prev, next, series);
    this.seriesLookupRow = new ActionRowBuilder().addComponents(ends, prev, next, character);
    this.updateComponents();

    if (this.state === "CHARACTER") {
      this.messageComponents[0] = this.characterLookupRow;
    } else {
      this.messageComponents[0] = this.seriesLookupRow;
    }

    // Select menu row
    await this.addSelectMenu();
  }

  async addSelectMenu() {
    switch (this.state) {
      case "CHARACTER": {
        // Create options for character select menu
        const options = await Promise.all(
          this.characterResultChunks[this.index].map(async ({ character, series, wishCount }) => {
            const formattedCharacter = await MapCache.getFormattedCharacter(character);

            return new StringSelectMenuOptionBuilder()
              .setEmoji(getWishListEmoji(wishCount))
              .setLabel(formattedCharacter)
              .setValue(JSON.stringify({ character: character, series: series }));
          })
        );

        // Create and configure character select menu
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("characterSelect")
          .setPlaceholder("Select a character")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(options);

        // Add character select menu to components
        this.components["characterSelect"] = selectMenu;
        const selectRow = new ActionRowBuilder().addComponents(selectMenu);
        this.messageComponents[1] = selectRow;
        break;
      }
      case "SERIES": {
        // Create options for series select menu
        const options = await Promise.all(
          this.seriesResultChunks[this.index].map(async ({ series, totalWishCount }) => {
            const formattedSeries = await MapCache.getFormattedSeries(series);

            return new StringSelectMenuOptionBuilder()
              .setEmoji(getWishListEmoji(totalWishCount))
              .setLabel(formattedSeries)
              .setValue(JSON.stringify({ series, totalWishCount }));
          })
        );

        // Create and configure series select menu
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("seriesSelect")
          .setPlaceholder("Select a series")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(options);

        // Add series select menu to components
        this.components["seriesSelect"] = selectMenu;
        const selectRow = new ActionRowBuilder().addComponents(selectMenu);
        this.messageComponents[1] = selectRow;
        break;
      }
    }
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
        await this.editMessage(i);
        break;
      }
      case "viewPrev": {
        if (this.index > 0) {
          this.index--;
        }
        await this.editMessage(i);
        break;
      }
      case "viewNext": {
        if (this.index < this.pages.length - 1) {
          this.index++;
        }
        await this.editMessage(i);
        break;
      }
      case "viewSeries": {
        this.state = "SERIES";
        this.messageComponents[0] = this.seriesLookupRow;
        this.pages = this.seriesResultPages;
        this.index = 0;
        await this.editMessage(i);
        break;
      }
      case "viewCharacter": {
        this.state = "CHARACTER";
        this.messageComponents[0] = this.characterLookupRow;
        this.pages = this.characterResultPages;
        this.index = 0;
        await this.editMessage(i);
        break;
      }
      case "characterSelect": {
        // Stop current button pages
        this.collector.stop("skipEditMessage");

        // Create and show character pages
        const selectedValue = i.values[0];
        const lcp = new LookupCharacterPages(i, selectedValue, this.saveState());
        await lcp.init();
        await lcp.createPages();
        await lcp.publishPages(true);
        return;
      }
      case "seriesSelect": {
        // Stop current button pages
        this.collector.stop("skipEditMessage");

        // Create and show series pages
        const selectedValue = i.values[0];
        const lcs = new LookupSeriesPages(i, selectedValue, this.saveState());
        await lcs.createPages();
        await lcs.publishPages(true);
        return;
      }
      default:
        return;
    }

    this.collector.resetTimer();
  }

  async editMessage(i) {
    this.updateComponents();

    this.messageComponents.pop();
    await this.addSelectMenu();

    // Update message
    i.message.edit({
      embeds: [this.pages[this.index]],
      components: this.messageComponents,
    });
  }
}

module.exports = LookupPages;
