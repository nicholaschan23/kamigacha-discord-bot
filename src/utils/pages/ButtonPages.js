const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");

class ButtonPages {
  constructor(interaction, pages, ephemeral = false) {
    // Interaction properties
    this.interaction = interaction;
    this.ephemeral = ephemeral;

    // Page properties
    this.pages = pages;
    this.index = 0;

    // Message components
    //  {customId, component}
    this.components = {};
    this.messageComponents = [];
    this.collector;
  }

  async publishPages() {
    await this.interaction.deferReply({ ephemeral: this.ephemeral });

    // 1 page, no buttons
    if (this.pages.length === 1) {
      const page = await this.interaction.editReply({
        embeds: this.pages,
        components: [],
        fetchReply: true,
      });
      return page;
    }

    // Multiple pages, with buttons
    this.addComponents();

    const currentPage = await this.interaction.editReply({
      embeds: [this.pages[this.index]],
      components: this.messageComponents,
      fetchReply: true,
    });

    // Get all valid customIds from the map
    const validCustomIds = Object.keys(this.components);

    this.collector = await currentPage.createMessageComponentCollector({
      filter: (i) => i.user.id === this.interaction.user.id && validCustomIds.includes(i.customId),
      time: 60_000,
    });

    this.collector.on("collect", this.handleCollect.bind(this));
    this.collector.on("end", this.handleEnd.bind(this, currentPage));

    return currentPage;
  }

  addComponents() {
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(prev, next);
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    this.messageComponents.push(row);
  }

  async handleCollect(i) {
    if (i.customId === "viewPrev" && this.index > 0) this.index--;
    if (i.customId === "viewNext" && this.index < this.pages.length - 1) this.index++;

    await i.deferUpdate();

    const prev = this.components["viewPrev"];
    const next = this.components["viewNext"];

    if (this.index === 0) prev.setDisabled(true);
    else prev.setDisabled(false);

    if (this.index === this.pages.length - 1) next.setDisabled(true);
    else next.setDisabled(false);

    if (this.ephemeral) {
      await this.interaction.editReply({
        embeds: [this.pages[this.index]],
        components: this.messageComponents,
        fetchReply: true,
      });
    } else {
      await i.message.edit({
        embeds: [this.pages[this.index]],
        components: this.messageComponents,
      });
    }
    
    this.collector.resetTimer();
  }

  async handleEnd(currentPage) {
    if (this.ephemeral) {
      await this.interaction.editReply({
        embeds: [this.pages[this.index]],
        components: [],
        fetchReply: true,
      });
    } else {
      await currentPage.edit({
        embeds: [this.pages[this.index]],
        components: [],
      });
    }
  }
}

module.exports = ButtonPages;
