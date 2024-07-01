const config = require("../../config/gacha");
const validKeys = [
  // Filters
  "c",
  "char",
  "character",
  "code",
  "f",
  "frame",
  "p",
  "pulled",
  "origin",
  "r",
  "rarity",
  "series",
  "server",
  "set",
  "sleeve",
  "t",
  "tag",
  "w",
  "wl",
  "wishlist",

  // Sorting
  "o",
  "order",
  "-a",
  "-asc",
  "-ascend",
  "-ascending",
  "-d",
  "-desc",
  "-descend",
  "-descending",
];
const validSortOrderKeys = ["-a", "-asc", "-ascend", "-ascending", "-d", "-desc", "-descend", "-descending"];
const validOperators = ["=", "<", ">", "<=", ">=", "!=", "<>"];

/**
 * Parses a filter string into an array of filter objects.
 *
 * The filter string is expected to be in lowercase and contain no commas.
 * It will be parsed into key, operator, and value triplets based on valid keys
 * and operators defined within the function.
 *
 * Example input: 'character=yato rarity>=r series="noragami"'
 * Example output: [
 *   { key: "character", operator: "=", value: "yato" },
 *   { key: "rarity", operator: ">=", value: "r" },
 *   { key: "series", operator: "=", value: "noragami" }
 * ]
 *
 * @param {string} filterString - The filter string to parse. Should be in lowercase and have no commas.
 * @returns {Array<Object>} - An array of filter objects with keys: key, operator, and value.
 */
function parseFilterString(filterString) {
  const regex = new RegExp(`\\b(${validKeys.join("|")})\\b\\s*(<>|!=|<=|>=|=|<|>)\\s*(?:"([^"]*)"|([^,\\s]+))`, "g");

  let match;
  const filters = [];

  while ((match = regex.exec(filterString)) !== null) {
    let key, operator, value;

    // Get key
    key = match[1];
    if (validSortOrderKeys.includes(key)) {
      operator = "";
      value = "";
      regex.lastIndex = match.index + key.length;
    } else {
      // Get operator
      operator = match[2];

      // Get value
      if (operator === "<>") {
        value = ""; // Reset value for <>
        // Adjust lastIndex to skip to the next valid key
        regex.lastIndex = match.index + key.length + operator.length;
      } else {
        // Quoted value in match[3], unquoted value in match[4]
        value = match[3] || match[4];
        value = value.replace(/\s+/g, " ").trim();
      }
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
  const display = new Set(); // What stats to display on collection page
  let sortField;
  let sortOrder;

  const filteredCards = cardList.filter((card) => {
    return filters.every(({ key, operator, value }) => {
      // Check for display
      if (operator === "<>") {
        switch (key) {
          case "w":
          case "wl":
          case "wishlist":
            display.add("wishlist");
          default: {
            return true;
          }
        }
      }

      // Check for sort order
      if (!sortOrder && key.slice(0, 1) === "-") {
        sortOrder = key;
        return true;
      }

      let cardValue = card[key];

      switch (key) {
        // Set order
        case "o":
        case "order": {
          if (operator === "=" && !sortField) {
            sortField = value;
          }
          return true;
        }

        // Handle string/number comparison filters
        case "c":
        case "char":
          cardValue = card["character"];
        case "character":
          break;
        case "code":
          break;
        case "f":
          cardValue = card["frame"];
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
          cardValue = card["generationType"];
          if (value === "sp" || value === "single-pull" || value === "pull") {
            value = "Pull";
          } else if (value === "mp" || value === "multi-pull") {
            value = "Multi-Pull";
          } else if (value === "u" || value === "upgrade") {
            value = "Upgrade";
          }
          break;
        }
        case "p":
        case "pulled":
          cardValue = card["pulledId"];
          if (value === "me" || value === "t" || value === "f" || value === "true" || value === "false") {
            value = userId;
          }
          break;
        case "r":
        case "rarity": {
          // Convert rarity strings into numbers
          cardValue = config.getRarityRank(cardValue);
          value = isNaN(value) ? config.getRarityRank(value) : value;
          break;
        }
        case "series":
          break;
        case "server": {
          cardValue = card["guildId"];
          if (value === "this" || value === "here") {
            value = guildId;
          }
          break;
        }
        // Wishlist and sets can only be numbers
        case "w":
        case "wl":
        case "wishlist":
          if (isNaN(value)) {
            return true;
          }
          cardValue = card["wishlist"];
          display.add("wishlist");
          break;
        case "set": {
          if (isNaN(value)) {
            return true;
          }
          break;
        }
        case "t":
          cardValue = card["tag"];
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

  switch (sortField) {
    case "date":
      break;
    case "w":
    case "wl":
      sortField = "wishlist";
    case "wishlist":
      display.add("wishlist");
      break;
    default: {
      sortField = "modified";
    }
  }

  switch (sortOrder) {
    case "-a":
    case "-asc":
    case "-ascend":
    case "-ascending":
      sortOrder = "asc";
      break;
    default: {
      sortOrder = "desc";
    }
  }

  filteredCards.sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      const aValueLower = aValue.toLowerCase();
      const bValueLower = bValue.toLowerCase();
      return sortOrder === "asc" ? aValueLower.localeCompare(bValueLower) : bValueLower.localeCompare(aValueLower);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    } else {
      return 0; // Handle other data types if necessary
    }
  });

  return [filteredCards, Array.from(display)];
}

module.exports = {
  parseFilterString,
  applyFilters,
};
