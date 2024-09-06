const colors = require("colors/safe");
const config = require("../config");

class Logger {
  constructor(origin) {
    this.origin = origin;
  }

  log(level, color, ...message) {
    const datePrefix = config.logDate ? `${colors.gray(new Date().toLocaleString())} ` : "";
    const levelPrefix = `${colors[color](`[${this.origin}] [${level.toUpperCase()}]`)} `;
    console.log(`${datePrefix}${levelPrefix}${message.join(" ")}`);
  }

  info(...message) {
    this.log("info", "cyan", ...message);
  }

  success(...message) {
    this.log("success", "green", ...message);
  }

  warn(...message) {
    this.log("warn", "yellow", ...message);
  }

  error(...message) {
    this.log("error", "red", ...message);
  }
}

module.exports = Logger;
