const fs = require("fs");
const path = require("path");
const Logger = require("../Logger");
const logger = new Logger("Interaction loader");
const { getJsFiles } = require("../fileSystem");

module.exports = (client) => {
  registerAutocompleteInteractions();
  registerButtonInteractions();
  registerModalInteractions();
  registerSelectMenuInteractions();

  /**
   * Registers autocomplete interactions.
   * Scans the specified directory for JavaScript files, requires them, and adds them to the client's autocomplete interactions collection.
   */
  function registerAutocompleteInteractions() {
    const autocompletePath = path.join(__dirname, "../../interactions/autocomplete");
    const autocompleteInteractions = fs.readdirSync(autocompletePath);

    for (const module of autocompleteInteractions) {
      const files = getJsFiles(path.join(autocompletePath, module));

      for (const interactionFile of files) {
        const interaction = require(path.join(autocompletePath, module, interactionFile));
        client.autocompleteInteractions.set(interaction.name, interaction);

        logger.success(`Successfully loaded ${interaction.name} interaction`);
      }
    }
  }

  /**
   * Registers button interactions.
   * Scans the specified directory for JavaScript files, requires them, and adds them to the client's button interactions collection.
   */
  function registerButtonInteractions() {
    const buttonPath = path.join(__dirname, "../../interactions/button");
    const buttonInteractions = fs.readdirSync(buttonPath);

    for (const module of buttonInteractions) {
      const files = getJsFiles(path.join(buttonPath, module));

      for (const buttonFile of files) {
        const button = require(path.join(buttonPath, module, buttonFile));
        client.buttonInteractions.set(button.id, button);
      }
    }
  }

  /**
   * Registers modal interactions.
   * Scans the specified directory for JavaScript files, requires them, and adds them to the client's modal interactions collection.
   */
  function registerModalInteractions() {
    const modalPath = path.join(__dirname, "../../interactions/modal");
    const modalInteractions = fs.readdirSync(modalPath);

    for (const module of modalInteractions) {
      const files = getJsFiles(path.join(modalPath, module));

      for (const modalFile of files) {
        const modal = require(path.join(modalPath, module, modalFile));
        client.modalInteractions.set(modal.id, modal);
      }
    }
  }

  /**
   * Registers select menu interactions.
   * Scans the specified directory for JavaScript files, requires them, and adds them to the client's select menu interactions collection.
   */
  function registerSelectMenuInteractions() {
    const selectMenusPath = path.join(__dirname, "../../interactions/selectMenu");
    const selectMenus = fs.readdirSync(selectMenusPath);

    for (const module of selectMenus) {
      const files = getJsFiles(path.join(selectMenusPath, module));

      for (const selectMenuFile of files) {
        const selectMenu = require(path.join(selectMenusPath, module, selectMenuFile));
        client.selectMenuInteractions.set(selectMenu.id, selectMenu);
      }
    }
  }
};
