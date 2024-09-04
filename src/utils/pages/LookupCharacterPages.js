const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder } = require("discord.js");
const ButtonPages = require("./ButtonPages");
const CharacterModel = require("../../database/mongodb/models/global/character");
const client = require("../../../bot");
const config = require("../../config");

class LookupCharacterPage extends ButtonPages {
  constructor(interaction, value, prevState) {
    super(interaction);

    const selection = JSON.parse(value);
    this.character = selection.character;
    this.series = selection.series;

    // Boolean to know which set of pages to be viewing
    this.onStats = true;

    // Save last lookup instance for "back" button
    this.prevState = prevState;
  }

  async init() {
    this.characterDocument = await CharacterModel().findOne({ character: this.character, series: this.series });
    this.wishCount = this.characterDocument.wishCount;
    this.circulation = this.characterDocument.circulation;
    this.setArray = this.getSetArray();
    this.set = this.setArray.slice(-1)[0]; // Latest set
    this.rarityArray = this.getRarityArray();
  }

  // Helper function to get a sorted array of character sets
  getSetArray() {
    // Convert circulation Map to an array of entries
    const entries = Array.from(this.circulation.entries());

    // Sort the array by timestamp
    entries.sort(([, a], [, b]) => {
      const timestampA = a.timestamp;
      const timestampB = b.timestamp;
      return timestampA - timestampB;
    });

    // Extract and return just the keys from the sorted entries
    return entries.map(([key]) => key);
  }

  // Helper function to get a sorted array of character rarities
  getRarityArray() {
    const keys = Array.from(this.circulation.get(this.set).rarities.keys());

    // Sort the keys based on rarity rank
    return keys.sort((a, b) => {
      const indexA = config.rarities.indexOf(a);
      const indexB = config.rarities.indexOf(b);

      // If one of the keys is not found in the rarity rank, it should appear last
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }

  /**
   * Helper function to create embeds for each page.
   */
  async createPages() {
    const statsPages = [];
    const zoomPages = [];

    for (let i = 0; i < this.rarityArray.length; i++) {
      const rarity = this.rarityArray[i];
      const stats = this.circulation.get(this.set).rarities.get(rarity);
      const circulation = stats.generated - stats.destroyed;
      const retention = stats.generated === 0 ? 0 : circulation / stats.generated;
      const jpg = [this.character, this.series, this.set, `${rarity.toLowerCase()}.jpg`].join("-");
      const url = [process.env.CLOUDFRONT_URL, "cards", this.series, this.set, rarity, jpg].join("/");

      const statEmbed = new EmbedBuilder()
        .setTitle(`Character Lookup`)
        .setDescription(
          `Character: ${client.characterNameMap[this.character]}\n` +
            `Series: ${client.seriesNameMap[this.series]}\n` +
            `Set: ${this.set}\n` +
            `Rarity: ${rarity}\n` +
            `\n` +
            `Wish count: ${this.wishCount.toLocaleString()}\n` +
            `\n` +
            `Total generated: ${stats.generated.toLocaleString()}\n` +
            `Total destroyed: ${stats.destroyed.toLocaleString()}\n` +
            `Circulation: ${circulation.toLocaleString()}\n` +
            `Retention Rate: ${Math.round(retention)}%`
        )
        .setThumbnail(url)
        .setFooter({ text: `Set ${this.set} — Showing cards ${i + 1}-${this.rarityArray.length} (${this.rarityArray.length} total))` });

      const zoomEmbed = new EmbedBuilder()
        .setTitle(`Character Lookup`)
        .setImage(url)
        .setFooter({ text: `Set ${this.set} — Showing cards ${i + 1}-${this.rarityArray.length} (${this.rarityArray.length} total))` });

      statsPages.push(statEmbed);
      zoomPages.push(zoomEmbed);
    }

    this.statsPages = statsPages;
    this.zoomPages = zoomPages;

    if (this.onStats) {
      this.pages = statsPages;
    } else {
      this.pages = zoomPages;
    }
    this.index = 0;
  }

  // Update disabled states of page buttons
  updateArrowComponents() {
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

  updateZoomStatsComponent() {
    const tzs = this.components["toggleZoomStats"];
    if (this.onStats) {
      this.pages = this.statsPages;
      tzs.setEmoji("🔎"); // Set to zoom emoji
    } else {
      this.pages = this.zoomPages;
      tzs.setEmoji("📊"); // Set to stats emoji
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
    this.updateArrowComponents();

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
        this.collector.stop();

        const LookupPages = require("./LookupPages"); // Import here to avoid circular dependency issues
        const bp = new LookupPages(i, []);
        bp.loadState(this.prevState);
        bp.publishPages(true);
        return;
      }
      case "toggleEnds": {
        if (!this.isEnd) {
          this.index = this.pages.length - 1;
        } else {
          this.index = 0;
        }
        this.isEnd = !this.isEnd;
        this.updateArrowComponents();
        break;
      }
      case "viewPrev": {
        if (this.index > 0) {
          this.index--;
        }
        this.updateArrowComponents();
        break;
      }
      case "viewNext": {
        if (this.index < this.pages.length - 1) {
          this.index++;
        }
        this.updateArrowComponents();
        break;
      }
      case "toggleZoomStats": {
        if (this.onStats) {
          this.onStats = false;
        } else {
          this.onStats = true;
        }
        this.updateZoomStatsComponent();
        break;
      }
      case "setSelect": {
        const selectedValue = i.values[0];
        this.set = selectedValue;
        await this.createPages();
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

module.exports = LookupCharacterPage;
