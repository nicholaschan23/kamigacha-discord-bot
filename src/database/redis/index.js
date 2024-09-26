const blacklist = require("./cache/blacklist");
const invite = require("./cache/invite");

module.exports = {
  ...blacklist,
  ...invite,
};
