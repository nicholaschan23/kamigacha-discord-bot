const { TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder } = require("discord.js");

const byeAmount = new TextInputBuilder()
  .setCustomId("byeAmount")
  .setLabel(`How many times would you like to say bye?`)
  .setValue(`1`)
  .setPlaceholder(`An input of 2 will display: Bye! Bye!`)
  .setStyle(TextInputStyle.Short)
  .setMinLength(1)
  .setMaxLength(1)
  .setRequired(true);
const actionRow = new ActionRowBuilder().addComponents(byeAmount);
const modal = new ModalBuilder()
  .setCustomId("byeModal")
  .setTitle("Bye");
modal.addComponents(actionRow);

module.exports = modal;
