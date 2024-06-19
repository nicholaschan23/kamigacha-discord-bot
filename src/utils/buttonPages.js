const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");

async function buttonPages(interaction, pages, ephemeral) {
  await interaction.deferReply({ ephemeral: ephemeral });

  // 1 page, no buttons
  if (pages.length === 1) {
    const page = await interaction.editReply({
      embeds: pages,
      components: [],
      fetchReply: true,
    });
    return page;
  }

  // Add buttons
  const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true);
  const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
  const row = new ActionRowBuilder().addComponents(prev, next);
  let index = 0;
  const currentPage = await interaction.editReply({
    embeds: [pages[index]],
    components: [row],
    fetchReply: true,
  });

  const collector = await currentPage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    if (interaction.user.id === i.user.id) {
      if (i.customId === "viewPrev") {
        if (index > 0) index--;
      }
      if (i.customId === "viewNext") {
        if (index < pages.length - 1) index++;
      }

      await i.deferUpdate();

      if (index === 0) prev.setDisabled(true);
      else prev.setDisabled(false);
      if (index === pages.length - 1) next.setDisabled(true);
      else next.setDisabled(false);

      if (ephemeral) {
        await interaction.editReply({
          embeds: [pages[index]],
          components: [row],
          fetchReply: true,
        });
      } else {
        await currentPage.edit({
          embeds: [pages[index]],
          components: [row],
        });
      }

      collector.resetTimer();
    }
  });

  // End the collector
  collector.on("end", async () => {
    if (ephemeral) {
      await interaction.editReply({
        embeds: [pages[index]],
        components: [],
        fetchReply: true,
      });
    } else {
      await currentPage.edit({
        embeds: [pages[index]],
        components: [],
      });
    }
  });
  return currentPage;
}

module.exports = buttonPages;
