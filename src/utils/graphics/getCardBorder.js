const config = require("../../config");

function getCardBorder(rarity) {
  const prefix = [config.IMAGES_PATH, "customisations/boarders"];
  switch (rarity.toLowerCase()) {
    case "r":
      prefix.push("default/default-r.png");
      break;
    case "ur":
      prefix.push("default/default-ur.png");
      break;
    case "sr":
      prefix.push("default/default-sr.png");
      break;
    case "ssr":
      prefix.push("default/default-ssr.png");
      break;
    default:
      prefix.push("default/default-c.png");
      break;
  }
  return prefix.join("/");
}

module.exports = { getCardBorder };