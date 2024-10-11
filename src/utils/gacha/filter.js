const config = require("@config/gacha");

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
const validOperators = ["!=", ">=", "<=", ">", "<", "="];

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
 * @param {String} filterString - The filter string to parse. Should be in lowercase and have no commas or quotes.
 * @returns {Array<Object>} An array of filter objects with keys: key, operator, and value.
 */
function parseFilterString(filterString) {
  if (filterString.length === 0) return [];

  const filters = [];

  // Split the filter string into tokens
  const tokens = filterString.split(/\s+/);

  // Preprocess tokens to handle <> and tokens that start with a dash
  tokens.forEach((token, index) => {
    if (token.includes("<>")) {
      const [key, operator] = token.split("<>");
      if (validKeys.includes(key)) {
        filters.push({ key, operator: "<>", value: "" });
        tokens[index] = ""; // Remove the processed token
      }
    } else if (validSortOrderKeys.includes(token)) {
      filters.push({ key: token, operator: "", value: "" });
      tokens[index] = ""; // Remove the processed token
    }
  });

  // Join the remaining tokens back into a string
  const remainingString = tokens.filter((token) => token).join(" ");

  let match;
  const regex = new RegExp(`\\b(${validKeys.join("|")})\\b\\s*(${validOperators.join("|")})\\s*(?:"([^"]*)"|([^,\\s]+))`, "g");
  while ((match = regex.exec(remainingString)) !== null) {
    const key = match[1];
    const operator = match[2];
    let value = match[3] || match[4]; // Depending whether the value is in quotes
    filters.push({ key, operator, value });
  }

  return filters;
}

function normalizeFilters(filters, userId, guildId) {
  const displayFeatures = new Set();
  let sortField, sortOrder;

  const normalizedFilters = filters.map(({ key, operator, value }) => {
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
              break;
            case "recent":
            case "modified":
              sortField = "modified";
              break;
            case "r":
            case "rarity":
              sortField = "rarity";
              break;
            case "set":
              sortField = "set";
              break;
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
        if (isNaN(value)) {
          return false;
        }
        normalizedKey = "set";
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
        if (operator === "<>") {
          displayFeatures.add("wishCount");
          return false;
        }

        if (isNaN(value)) {
          return false;
        }
        normalizedKey = "wishCount";
        normalizedValue = parseInt(value);
        displayFeatures.add("wishCount");
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

  return { normalizedFilters, displayFeatures, sortField, sortOrder };
}

function applyFilters(cardList, filters, userId, guildId) {
  const filteredCards = [];

  const { normalizedFilters, displayFeatures, sortField, sortOrder } = normalizeFilters(filters, userId, guildId);

  for (const card of cardList) {
    const passedFilters = normalizedFilters.every(({ key, operator, value }) => {
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
          cardValue = cardValue.split("-");
          break;
        case "set": {
          break;
        }
        case "tag": {
          break;
        }
        case "wishCount":
          break;
      }

      if (["character", "series", "frame", "sleeve"].includes(key) && typeof cardValue !== "boolean") {
        switch (operator) {
          case "=":
            return value.every((word) => cardValue.includes(word));
          case "!=":
            return value.every((word) => !cardValue.includes(word));
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
    let aValue, bValue;
    switch (sortField) {
      case "set":
      case "wishCount":
        aValue = parseInt(a[sortField]);
        bValue = parseInt(b[sortField]);
        break;
      case "rarity":
        aValue = config.getRarityRank(a[sortField]);
        bValue = config.getRarityRank(b[sortField]);
        break;
      default:
        aValue = a[sortField];
        bValue = b[sortField];
        break;
    }

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

  return [filteredCards.slice(0, 500), Array.from(displayFeatures)];
}

module.exports = {
  parseFilterString,
  applyFilters,
};
