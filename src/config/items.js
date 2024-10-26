const ItemInfo = require("@models/ItemInfo");

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

const currency = [
  ["gold", new ItemInfo("🏵️", "Gold", "currency")],
  ["premium currency", new ItemInfo("💎", "Premium Currency", "currency")],
];

const material = [
  ["c material", new ItemInfo("🔑", "C Material (★☆☆☆☆)", "material")],
  ["r material", new ItemInfo("🔑", "R Material (★★☆☆☆)", "material")],
  ["ur material", new ItemInfo("🔑", "UR Material (★★★☆☆)", "material")],
  ["sr material", new ItemInfo("🔑", "SR Material (★★★★☆)", "material")],
  ["ssr material", new ItemInfo("🔑", "SSR Material (★★★★★)", "material")],
  ["tear material", new ItemInfo("🔑", "SSR Material (★★★★★)", "material")],
];

const itemsMap = new Map([...currency, ...material]);

module.exports = {
  itemTypes,
  itemsMap,
};
