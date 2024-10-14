const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const config = require("@config");
const CharacterModel = require("@database/mongodb/models/global/character");
const MapCache = require("@database/redis/cache/map");
const ButtonPages = require("@pagination/ButtonPages");
const { chunkArray } = require("@utils/string/formatPage");
const { formatLookupSetPage } = require("@utils/string/formatPage");

class LookupSeriesPages extends ButtonPages {
  constructor(interaction, value, prevState = null) {
    super(interaction);

    const selection = JSON.parse(value);
    this.series = selection.series;
    this.totalWishCount = selection.totalWishCount;

    // Boolean to know which set of pages to be viewing
    this.onStats = true;

    // Save last lookup instance for "back" button
    this.prevState = prevState;
  }

  async createPages() {
    this.setPagesMap = new Map(); // { set: [page1, page2, ...] }
    this.seriesModel = await MapCache.getMapEntry("card-model-map", this.series);

    const setPromises = Object.entries(this.seriesModel).map(async ([setKey, setValue]) => {
      const rarityFrequency = [0, 0, 0, 0, 0];
      const characterRarityMap = new Map();

      const rarityPromises = Object.entries(setValue).map(async ([rarity, filenames]) => {
        const filenamePromises = filenames.map(async (filename) => {
          const characterKey = filename.split(`-${this.series}-`)[0];
          if (!characterRarityMap.has(characterKey)) {
            characterRarityMap.set(characterKey, [false, false, false, false, false]);
          }

          const rarityIndex = config.rarities.indexOf(rarity);
          if (rarityIndex !== -1) {
            rarityFrequency[rarityIndex]++;
            characterRarityMap.get(characterKey)[rarityIndex] = true;
          }
        });

        await Promise.all(filenamePromises);
      });

      await Promise.all(rarityPromises);

      // Sort entries by most rare
      const sortedEntries = Array.from(characterRarityMap.entries()).sort(([keyA, valueA], [keyB, valueB]) => {
        return (
          valueB[4] - valueA[4] || valueB[3] - valueA[3] || valueB[2] - valueA[2] || valueB[1] - valueA[1] || valueB[0] - valueA[0] || keyA.localeCompare(keyB)
        );
      });

      const chunks = chunkArray(sortedEntries, 10);
      const pages = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const formattedSeries = await MapCache.getFormattedSeries(this.series);
        const [formattedCharacters, formattedValues] = await formatLookupSetPage(chunk, rarityFrequency);
        const first = (i * 10 + 1).toLocaleString();
        const last = (i * 10 + chunk.length).toLocaleString();
        const total = chunks.length > 0 ? ((chunks.length - 1) * 10 + chunks[chunks.length - 1].length).toLocaleString() : "0";

        const embed = new EmbedBuilder()
          .setTitle(`Set Lookup`)
          .setDescription(`**Series**: ${formattedSeries}\n` + `**Set**: ${setKey}\n` + `**Wish count**: ${this.totalWishCount}`)
          .addFields({ name: "Character", value: formattedCharacters, inline: true }, { name: "C, R, UR, SR, SSR", value: `${formattedValues}`, inline: true })
          .setFooter({ text: `Set ${setKey} — Showing characters ${first}-${last} (${total} total)` });

        pages.push(embed);
      }

      this.setPagesMap.set(setKey, pages);
    });

    await Promise.all(setPromises);
    this.setArray = Object.keys(this.seriesModel);
    this.pages = this.setPagesMap.get(this.setArray[this.setArray.length - 1]);
    this.index = 0;
  }

  // Update disabled states of page buttons
  updateComponents() {
    const back = this.components["backToLookup"];
    if (this.prevState === null) {
      back.setDisabled(true);
    } else {
      back.setDisabled(false);
    }

    const ends = this.components["toggleEnds"];
    if (this.index === 0 && this.index === this.pages.length - 1) {
      ends.setDisabled(true);
    } else {
      ends.setDisabled(false);
    }

    const prev = this.components["viewPrev"];
    if (this.index === 0) {
      prev.setDisabled(true);
    } else {
      prev.setDisabled(false);
    }

    const next = this.components["viewNext"];
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
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    const zoomStats = new ButtonBuilder().setCustomId("toggleZoomStats").setEmoji("🔎").setStyle(ButtonStyle.Secondary);
    this.components["backToLookup"] = back;
    this.components["toggleEnds"] = ends;
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    this.components["toggleZoomStats"] = zoomStats;
    this.updateComponents();

    // Button row
    const buttonRow = new ActionRowBuilder().addComponents(back, ends, prev, next);
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
        this.setArray
          .slice()
          .reverse()
          .map((set) => {
            const ssmob = new StringSelectMenuOptionBuilder();
            ssmob.setLabel(`Set ${set}`);
            ssmob.setValue(set);

            // if (isNaN(set)) {
            //   ssmob.setLabel(set);
            // } else {
            //   ssmob.setLabel(`Set ${set}`)
            // }
            return ssmob;
          })
      );
    this.components["setSelect"] = selectMenu;
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.messageComponents.push(selectRow);
  }

  async handleCollect(i) {
    await i.deferUpdate();

    switch (i.customId) {
      case "backToLookup": {
        this.collector.stop("skipEditMessage");

        const LookupPages = require("./LookupPages"); // Import here to avoid circular dependency issues
        const bp = new LookupPages(i, [], []);
        bp.loadState(this.prevState);
        bp.publishPages(true);
        return;
      }
      case "toggleEnds": {
        const last = this.pages.length - 1;
        if (this.index === 0 || this.index < last / 2) {
          this.index = last;
        } else {
          this.index = 0;
        }
        this.updateComponents();
        break;
      }
      case "viewPrev": {
        if (this.index > 0) {
          this.index--;
        }
        this.updateComponents();
        break;
      }
      case "viewNext": {
        if (this.index < this.pages.length - 1) {
          this.index++;
        }
        this.updateComponents();
        break;
      }
      case "setSelect": {
        const selectedValue = i.values[0];
        this.pages = this.setPagesMap.get(selectedValue);
        this.index = 0;
        this.updateComponents();
        break;
      }
      default:
        return;
    }

    // Update message
    i.message.edit({
      embeds: [this.pages[this.index]],
      components: this.messageComponents,
    });

    this.collector.resetTimer();
  }
}

module.exports = LookupSeriesPages;
