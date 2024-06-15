const loadWhitelist = async (client) => {
  try {
    const players = await Player.find({ whitelisted: true }); // Fetch all whitelisted players
    players.forEach(player => client.whitelist.add(player.id)); // Add player IDs to the Set
    console.log(`Whitelist loaded. ${whitelist.size} players whitelisted.`);
  } catch (error) {
    console.error('Error loading whitelist:', error);
  }
};