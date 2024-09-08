const client = require("./client");
const gacha = require("./gacha");
const items = require("./items");
const paths = require("./paths");

module.exports = {
  ...client,
  ...gacha,
  ...items,
  ...paths,
};
