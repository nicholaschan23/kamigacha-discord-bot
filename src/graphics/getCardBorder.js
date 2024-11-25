const config = require("@config");

function getCardBorder(rarity) {
  const prefix = [config.ASSETS_PATH, "borders"];
  switch (rarity.toLowerCase()) {
    case "r":
      prefix.push("r_border.png");
      break;
    case "ur":
      prefix.push("ur_border.png");
      break;
    case "sr":
      prefix.push("sr_border.png");
      break;
    case "ssr":
      prefix.push("ssr_border.png");
      break;
    default:
      prefix.push("c_border.png");
      break;
  }
  return prefix.join("/");
}

module.exports = { getCardBorder };
