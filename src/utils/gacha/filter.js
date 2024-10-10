const config = require("@config/gacha");
const { replaceAccents } = require("@utils/string/format");

const validKeys = [
  // Filters
  "c",
  "char",
  "character",
  "code",
  "f",
  "frame",
  "guild",
  "p",
  "pulled",
  "origin",
  "r",
  "rarity",
  "s",
  "series",
  "server",
  "set",
  "sleeve",
  "t",
  "tag",
  "w",
  "wc",
  "wish",
  "wishcount",
  "wishlist",
  "wl",

  // Sorting
  "o",
  "order",
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
 * @param {String} filterString - The filter string to parse. Should be in lowercase and have no commas.
 * @returns {Array<Object>} An array of filter objects with keys: key, operator, and value.
 */
function parseFilterString(filterString) {
  const regex = new RegExp(`\\b(${[...validKeys, ...validSortOrderKeys].join("|")})\\b\\s*(<>|!=|<=|>=|=|<|>)\\s*(?:"([^"]*)"|([^,\\s]+))`, "g");

  let match;
  const filters = [];

  while ((match = regex.exec(filterString)) !== null) {
    let key, operator, value;

    // Get key
    key = match[1].toLowerCase();
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
        value = value.replace(/\s+/g, " ").trim().toLowerCase();
        value = replaceAccents(value);
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

function preprocessFilters(filters, userId, guildId) {
  const displayFeatures = new Set();
  let sortField, sortOrder;

  const preprocessedFilters = filters.map(({ key, operator, value }) => {
    let normalizedKey = key;
    let normalizedValue = value;

    switch (key) {
      case "c":
      case "char":
      case "character":
        normalizedKey = "character";
        normalizedValue = value.split(" ");
        break;
      case "f":
      case "frame":
        normalizedKey = "frame";
        if (value === "t" || value === "true") {
          normalizedValue = true;
        } else if (value === "f" || value === "false" || value === "none") {
          normalizedValue = false;
        } else {
          normalizedValue = value.split(" ");
        }
        break;
      case "o":
      case "order": {
        if (operator === "=" && !sortField) {
          switch (value) {
            case "w":
            case "wc":
            case "wish":
            case "wishcount":
            case "wishlist":
            case "wl":
              sortField = "wishCount";
              displayFeatures.add("wishCount");
              break;
            case "date":
              sortField = "date";
            case "recent":
            case "modified":
              sortField = "modified";
          }
        }
        return false; // Skip sorting key
      }
      case "origin":
        normalizedKey = "generationType";
        if (value === "sp" || value === "single-pull" || value === "pull") {
          normalizedValue = "Pull";
        } else if (value === "mp" || value === "multi-pull") {
          normalizedValue = "Multi-Pull";
        } else if (value === "u" || value === "upgrade") {
          normalizedValue = "Upgrade";
        }
        break;
      case "p":
      case "pulled":
        normalizedKey = "pulledId";
        if (value === "me" || value === "t" || value === "f" || value === "true" || value === "false") {
          normalizedValue = userId;
        }
        break;
      case "r":
      case "rarity":
        normalizedKey = "rarity";
        normalizedValue = isNaN(value) ? config.getRarityRank(value) : value;
        break;
      case "s":
      case "series":
        normalizedKey = "series";
        normalizedValue = value.split(" ");
        break;
      case "guild":
      case "server":
        normalizedKey = "guildId";
        if (value === "this" || value === "here") {
          normalizedValue = guildId;
        }
        break;
      case "set":
        normalizedKey = "set";
        if (isNaN(value)) {
          return false;
        }
        normalizedValue = parseInt(value);
        break;
      case "sleeve":
        normalizedKey = "sleeve";
        if (value === "t" || value === "true") {
          normalizedValue = true;
        } else if (value === "f" || value === "false" || value === "none") {
          normalizedValue = false;
        } else {
          normalizedValue = value.split(" ");
        }
        break;
      case "t":
      case "tag":
        normalizedKey = "tag";
        break;
      case "w":
      case "wc":
      case "wish":
      case "wishcount":
      case "wishlist":
      case "wl":
        normalizedKey = "wishCount";
        displayFeatures.add("wishCount");
        if (operator === "<>") {
          return false;
        }
        break;
      default:
        if (!sortOrder && key.slice(0, 1) === "-") {
          switch (key) {
            case "-a":
            case "-asc":
            case "-ascend":
            case "-ascending":
              sortOrder = "asc";
              break;
            case "-d":
            case "-desc":
            case "-descend":
            case "-descending":
              sortOrder = "desc";
              break;
          }
        }
        return false; // Skip unrecognized keys
    }

    return { key: normalizedKey, operator, value: normalizedValue };
  });

  // Default sort field
  if (!sortField) {
    sortField = "modified";
  }

  if (!sortOrder) {
    sortOrder = "desc";
  }

  return { preprocessedFilters, displayFeatures, sortField, sortOrder };
}

function applyFilters(cardList, filters, userId, guildId) {
  const filteredCards = [];

  const { preprocessedFilters, displayFeatures, sortField, sortOrder } = preprocessFilters(filters, userId, guildId);

  for (const card of cardList) {
    const passedFilters = preprocessedFilters.every(async ({ key, operator, value }) => {
      let cardValue = card[key]; // Field that will be compared to the value
      switch (key) {
        case "character":
          cardValue = cardValue.split("-");
          break;
        case "frame":
          break;
        case "generationType":
          break;
        case "guildId":
          break;
        case "pulledId":
          break;
        case "rarity": {
          cardValue = config.getRarityRank(cardValue);
          break;
        }
        case "series":
          cardValue = card["series"].split("-");
          break;
        case "set": {
          break;
        }
        case "tag": {
          break;
        }
        case "wishCount":
          break;
        default:
          return true; // If the key is not recognized, do not filter it out
      }

      if (["character", "series", "frame", "sleeve"].includes(key) && typeof cardValue !== "boolean") {
        switch (operator) {
          case "=":
            return value.some((word) => cardValue.includes(word));
          case "!=":
            return value.some((word) => !cardValue.includes(word));
          default:
            return true; // Invalid operator for these keys
        }
      } else {
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
      }
    });

    if (passedFilters) {
      filteredCards.push(card);
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

  const slicedCards = filteredCards.slice(0, 500); // Adjust the slice range as needed
  return [slicedCards, Array.from(displayFeatures)];
}

module.exports = {
  parseFilterString,
  applyFilters,
};
