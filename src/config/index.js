const client = require("./client");
const gacha = require("./gacha");
const paths = require("./paths")

module.exports = {
  ...client,
  ...gacha,
  ...paths,
};
