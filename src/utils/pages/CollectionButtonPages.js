const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const ButtonPages = require("./ButtonPages");
const { formatCardInfoPage, chunkArray } = require("../gacha/format");

class CollectionButtonPages extends ButtonPages {
  constructor(interaction, collectionDocument) {
    super(interaction, [], collectionDocument.isPrivate);
    this.user = interaction.user;
    this.cardList = collectionDocument.cardsOwned;

    // Split the list of cards into chunks of 10
    this.cardChunks = chunkArray(this.cardList.reverse(), 10);

    // Create page embeds
    this.pages = this.createPages();
  }

  createPages() {
    const pages = [];
    for (let i = 0; i < this.cardChunks.length; i++) {
      const embed = new EmbedBuilder()
        .setTitle(`Card Collection`)
        .setDescription(`Cards owned by ${this.user}\n\n` + formatCardInfoPage(this.cardChunks[i]))
        .setFooter({ text: `Page ${i + 1}` });
      pages.push(embed);
    }
    return pages;
  }

  addComponents() {
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    const clipboard = new ButtonBuilder().setCustomId("copyClipboard").setEmoji("📋").setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder().addComponents(prev, next, clipboard);
    this.buttons["viewPrev"] = prev;
    this.buttons["viewNext"] = next;
    this.buttons["copyClipboard"] = clipboard;
    this.components.push(row);
  }

  async handleCollect(i) {
    // Only listen to the user who started interaction
    if (this.interaction.user.id !== i.user.id) {
      return await i.deferUpdate();
    }

    await i.deferUpdate();

    // Handle previous and next page buttons
    if (i.customId === "viewPrev" || i.customId === "viewNext") {
      if (i.customId === "viewPrev" && this.index > 0) this.index--;
      if (i.customId === "viewNext" && this.index < this.pages.length - 1) this.index++;

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
    } else if (i.customId === "copyClipboard") {
      let codes = [];
      for (const cardData of this.cardChunks[this.index]) {
        codes.push(cardData.code);
      }
      await this.interaction.followUp(codes.join(", "));
    }

    // Reset time if any button was pressed
    this.collector.resetTimer();
  }
}

module.exports = CollectionButtonPages;
