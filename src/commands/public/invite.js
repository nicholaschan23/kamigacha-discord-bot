const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const config = require("../../config");
const utils = require("../../utils");
const logger = new utils.Logger("Invite command");
const createNewPlayer = require("../../database/mongodb/createNewPlayer");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Invite someone to play Kami Gacha.")
    .addUserOption((option) => option.setName("user").setDescription("Who to invite to play Kami Gacha.").setRequired(true)),

  async execute(client, interaction) {
    const receiver = interaction.options.getUser("user");

    // You can't invite yourself or bots
    if (receiver.id == interaction.user.id || receiver.bot) {
      return await interaction.reply({ content: `Please input a valid user.`, ephemeral: true });
    }

    // Check if receiver is already invited
    if (client.inviteCache.isInvited(receiver)) {
      return await interaction.reply({ content: `This user is already invited.`, ephemeral: true });
    }

    // Create message to send
    const embed = new EmbedBuilder().setTitle("Invitation").setDescription(`${receiver}, you've received an invite from ${interaction.user} to play Kami Gacha! Would you like to accept?`);
    const acceptButton = new ButtonBuilder().setCustomId("acceptInvite").setEmoji("✅").setStyle(ButtonStyle.Secondary);
    const rejectButton = new ButtonBuilder().setCustomId("rejectInvite").setEmoji("❌").setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder().addComponents(acceptButton, rejectButton);

    // Send message and wait for a response
    const invitationMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    const collector = invitationMessage.createMessageComponentCollector({ time: 60_000 });

    // Handle the button interactions
    collector.on("collect", async (i) => {
      try {
        if (i.customId === "acceptInvite") {
          if (i.user.id !== receiver.id) return await i.deferUpdate();

          await client.inviteCache.addInvite(interaction.user.id, receiver.id);
          await createNewPlayer(client, interaction.user.id);
          embed.setColor(config.embedColor.green).setDescription(`${i.user} accepted the invitation!`);
        } else if (i.customId === "rejectInvite") {
          if (i.user.id == receiver.id) {
            embed.setColor(config.embedColor.red).setDescription(`${i.user} rejected the invitation.`);
          } else if (i.user.id == interaction.user.id) {
            embed.setColor(config.embedColor.red).setDescription(`${i.user} withdrew the invitation.`);
          } else {
            return await i.deferUpdate();
          }
        }
        await i.update({ embeds: [embed], components: [] });
        collector.stop();
      } catch (error) {
        if (config.debug) return logger.error(error.stack);
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        embed.setColor(config.embedColor.red).setDescription(`No response from ${receiver}. The invitation has expired.`);
        await invitationMessage.edit({ embeds: [embed], components: [] });
      }
    });
  },
};

function validateReceiver() {}
