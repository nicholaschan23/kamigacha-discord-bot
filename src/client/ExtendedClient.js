const { Client, Collection } = require("discord.js");
const shutdownManager = require("@utils/shutdownManager");
const findEvents = require("./findEvents");

class ExtendedClient extends Client {
  constructor(options) {
    super(options);

    // Collections
    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.autocompleteInteractions = new Collection();
    // this.buttonInteractions = new Collection();
    // this.modalInteractions = new Collection();
    // this.selectMenuInteractions = new Collection();
  }

  async init() {
    findEvents(this); // Load event listeners

    shutdownManager.register(async () => {
      await this.destroy();
    });

    await this.login(process.env.DISCORD_BOT_TOKEN);
  }
}

module.exports = ExtendedClient;
