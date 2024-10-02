module.exports = {
  developer: {
    userId: "195592343771021312",
    guildId: "1036473558144127039",
  },

  // Debug mode for console log
  debug: true,

  // Date prefix in each Logger message
  logDate: false,

  // Default global command cooldown
  cooldown: {
    default: 5,
  },

  // Preset embed colors
  embedColor: {
    red: "#dd2e44",
    yellow: "#ffcc4d",
    green: "#77b255",
    blue: "#5865f2",
    // red: "#f04747",
    // yellow: "#faa61a",
    // green: "#43b581",
    // blue: "#7289da",
  },

  // Redis cache expiration
  redisExpiration: {
    default: 600, // 10 minutes
  },
};
