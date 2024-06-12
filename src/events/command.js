const { Collection, Events } = require("discord.js");
const config = require("../config")
const utils = require("../utils");
const logger = new utils.Logger("Command");

module.exports = {
  event: Events.InteractionCreate,
  type: "on",

  async call(client, interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`Command ${interaction.commandName} not found or loaded`);
      return interaction.reply({ ephemeral: true, content: `Command not found. Please report this!` });
    }

    // Manage user's command cooldowns
    const cooldowns = client.cooldowns;
    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = config.cooldown.default;
    const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

      if (now < expirationTime) {
        const secondsLeft = Math.ceil((expirationTime - now) / 1000);
        return await interaction.reply({
          content: `You can run that command again in \`${secondsLeft} second${secondsLeft > 1 ? "s" : ""}\`.`,
          ephemeral: true,
        });
      }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    // Execute the command
    try {
      await command.execute(client, interaction);
    } catch (error) {
      logger.error(error.stack);
      return interaction.reply({ ephemeral: true, content: `Error executing command! Please try again. If the error persists, please report it to a developer.` }).catch(() => "");
    }
  },
};

async function checkCooldown(client, interaction) {
  // Global command cooldown
}
