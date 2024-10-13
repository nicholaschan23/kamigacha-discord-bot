const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

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

  async publishPages(isDeferred = false) {
    if (!isDeferred) {
      await this.interaction.deferReply({ ephemeral: this.ephemeral });
    }

    await this.addComponents();

    const currentPage = await this.interaction.editReply({
      embeds: [this.pages[this.index]],
      components: this.messageComponents,
      fetchReply: true,
    });

    // No components to listen to
    if (this.messageComponents.length === 0) return;

    // Initialize collectors
    this.collector = await currentPage.createMessageComponentCollector({
      filter: (i) => i.user.id === this.interaction.user.id,
      time: 60_000,
    });
    this.collector.on("collect", this.handleCollect.bind(this));
    // this.collector.on("end", this.handleEnd.bind(this, currentPage));
    this.collector.on("end", (collected, reason) => this.handleEnd(currentPage, reason));

    return;
  }

  addComponents() {
    if (this.pages.length === 1) return;

    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(prev, next);
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    this.messageComponents.push(row);
    this.updateComponents();
  }

  updateComponents() {
    const prev = this.components["viewPrev"];
    if (this.index === 0) prev.setDisabled(true);
    else prev.setDisabled(false);

    const next = this.components["viewNext"];
    if (this.index === this.pages.length - 1) next.setDisabled(true);
    else next.setDisabled(false);
  }

  async handleCollect(i) {
    if (i.customId === "viewPrev" && this.index > 0) this.index--;
    if (i.customId === "viewNext" && this.index < this.pages.length - 1) this.index++;

    await i.deferUpdate();

    this.updateComponents();

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

  async handleEnd(currentPage, reason) {
    if (reason === "skipEditMessage") {
      return;
    }

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
