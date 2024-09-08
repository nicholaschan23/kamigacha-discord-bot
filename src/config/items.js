// The order of this determines how they'll show up in the inventory by default
const itemTypes = {
  currency: {
    icon: "💎",
  },
  frame: {
    icon: "🖼️",
  },
  sleeve: {
    icon: "",
  },
  material: {
    icon: "🛠️",
  },
  event: {
    icon: "",
  },
};

const items = {
  // Currency
  gold: {
    icon: "🏵️",
    name: "Gold",
  },
  "premium-currency": {
    icon: "💎",
    name: "Premium Currency",
  },

  // Material
  "c-material": {
    icon: "🔑",
    name: "C Material (★☆☆☆☆)",
  },
  "r-material": {
    icon: "🔑",
    name: "R Material (★★☆☆☆)",
  },
  "ur-material": {
    icon: "🔑",
    name: "UR Material (★★★☆☆)",
  },
  "sr-material": {
    icon: "🔑",
    name: "SR Material (★★★★☆)",
  },
  "ssr-material": {
    icon: "🔑",
    name: "SSR Material (★★★★★)",
  },
};

module.exports = {
  itemTypes,
  items,
};
