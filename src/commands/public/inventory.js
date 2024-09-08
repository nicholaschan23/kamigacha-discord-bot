const { SlashCommandBuilder } = require("discord.js");
const InventoryModel = require("../../database/mongodb/models/user/inventory");
const InventoryPages = require("../../utils/pages/InventoryPages");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("inventory").setDescription("View your inventory."),

  async execute(client, interaction) {
    const inventoryDocument = await InventoryModel().findOneAndUpdate(
      { userId: interaction.user.id },
      { $setOnInsert: { userId: interaction.user.id } },
      { new: true, upsert: true }
    );

    inventoryDocument.inventory.set("gold", {quantity: 1000, type: "currency"})
    inventoryDocument.inventory.set("gem", {quantity: 1000, type: "currency"})
    inventoryDocument.inventory.set("ssr-key", {quantity: 1000, type: "material"})

    if (inventoryDocument.inventory.size === 0) {
      return interaction.reply({ content: "Your inventory is empty.", ephemeral: true });
    } else {
      const bp = new InventoryPages(interaction, inventoryDocument);
      bp.publishPages();
    }
  },
};
