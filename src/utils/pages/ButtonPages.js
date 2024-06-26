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
    this.buttons = {};
    this.components = [];
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
      components: this.components,
      fetchReply: true,
    });

    this.collector = await currentPage.createMessageComponentCollector({
      componentType: ComponentType.Button,
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
    this.buttons["viewPrev"] = prev;
    this.buttons["viewNext"] = next;
    this.components.push(row);
  }

  async handleCollect(i) {
    if (this.interaction.user.id === i.user.id) {
      if (i.customId === "viewPrev" && this.index > 0) this.index--;
      if (i.customId === "viewNext" && this.index < this.pages.length - 1) this.index++;

      await i.deferUpdate();

      const prev = this.buttons["viewPrev"];
      const next = this.buttons["viewNext"];

      if (this.index === 0) prev.setDisabled(true);
      else prev.setDisabled(false);

      if (this.index === this.pages.length - 1) next.setDisabled(true);
      else next.setDisabled(false);

      if (this.ephemeral) {
        await this.interaction.editReply({
          embeds: [this.pages[this.index]],
          components: this.components,
          fetchReply: true,
        });
      } else {
        await i.message.edit({
          embeds: [this.pages[this.index]],
          components: this.components,
        });
      }

      this.collector.resetTimer();
    }
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
