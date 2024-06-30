const config = require("../../config/gacha");
const validKeys = [
  "char",
  "character",
  "code",
  "frame",
  "pulled",
  "order",
  "origin",
  "rarity",
  "series",
  "server",
  "set",
  "sleeve",
  "tag",
  "wishlist",
  // "dyed",
  // "morphed",
  // "trimmed",
  // "sketched",
  // "grabbed",
  // "dropped",
  // "injured",
];
const validOperators = ["=", "<", ">", "<=", ">=", "!=", "<>"];

function parseFilterString(filterString) {
  const regex = new RegExp(`\\b(${validKeys.join("|")})\\b\\s*(<>|!=|<=|>=|=|<|>)\\s*(?:"([^"]*)"|([^,\\s]+))`, "g");

  let match;
  const filters = [];

  while ((match = regex.exec(filterString)) !== null) {
    const key = match[1];
    const operator = match[2];
    let value;
    if (operator === "<>") {
      value = ""; // Reset value for <>
      // Adjust lastIndex to skip to the next valid key
      regex.lastIndex = match.index + match[1].length + match[2].length;
    } else {
      // Quoted value in match[3], unquoted value in match[4]
      value = match[3] || match[4];
      value = value.replace(/\s+/g, " ").trim();
    }

    // Validate key and operator
    if (validKeys.includes(key) && validOperators.includes(operator)) {
      filters.push({ key, operator, value });
    } else {
      console.warn(`Invalid filter encountered and skipped: ${key}${operator}${value}`);
    }
  }

  return filters;
}

function applyFilters(cardList, filters, userId, guildId) {
  // const displayOnlyFilters = filters.filter(({ operator }) => operator === "<>");
  // const filterConditions = filters.filter(({ operator }) => operator !== "<>");

  const filteredCards = cardList.filter((card) => {
    return filters.every(({ key, operator, value }) => {
      let cardValue = card[key];

      switch (key) {
        // Handle string/number comparison filters
        case "character":
          break;
        case "code":
          break;
        case "frame":
        case "sleeve": {
          if (value === "t" || value === "true") {
            cardValue = !!cardValue; // Ensure cardValue is a boolean
            value = true;
          } else if (value === "f" || value === "false" || value === "none") {
            cardValue = !!cardValue; // Ensure cardValue is a boolean
            value = false;
          }
          break;
        }
        case "origin": {
          if (value === "sp" || value === "single-pull" || value === "pull") {
            value = "Pull";
          } else if (value === "mp" || value === "multi-pull") {
            value = "Multi-Pull";
          } else if (value === "u" || value === "upgrade") {
            value = "Upgrade";
          }
          break;
        }
        case "pulled":
          if (value === "me" || value === "true" || value === "false") {
            value = userId;
          }
          break;
        case "rarity": {
          // Convert rarity strings into numbers
          cardValue = config.getRarityRank(cardValue);
          value = isNaN(value) ? config.getRarityRank(value) : value;
          break;
        }
        case "series":
          break;
        case "server": {
          if (value === "this" || value === "here") {
            value = guildId;
          }
          break;
        }
        // Wishlist and sets can only be numbers
        case "wishlist":
        case "set": {
          if (isNaN(value)) {
            return;
          }
        }
        case "tag":
          break;
        default:
          return true; // If the key is not recognized, do not filter it out
      }
      switch (operator) {
        case "=":
          return cardValue == value;
        case "!=":
          return cardValue != value;
        case ">":
          return cardValue > value;
        case "<":
          return cardValue < value;
        case ">=":
          return cardValue >= value;
        case "<=":
          return cardValue <= value;
        default:
          return true;
      }
    });
  });

  return filteredCards;

  // if (displayOnlyFilters.length > 0) {
  //   return {
  //     filteredCards,
  //     displayOnly: displayOnlyFilters.map((filter) => filter.key),
  //   };
  // } else {
  //   return { filteredCards };
  // }
}

module.exports = {
  parseFilterString,
  applyFilters,
};
