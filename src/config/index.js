const client = require("./client");
const gacha = require("./gacha");

module.exports = {
  ...client,
  ...gacha,
};
