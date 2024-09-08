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
  }
};

const items = {
  // Currency
  gold: {
    icon: "🏵️",
    name: "Gold",
  },
  gem: {
    icon: "💎",
    name: "Gems",
  },
  "ssr-key": {
    icon: "🔑",
    name: "SSR Key (★★★★★)",
  }
};

module.exports = {
  itemTypes,
  items,
};
