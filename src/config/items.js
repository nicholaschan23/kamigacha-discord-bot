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

const itemsArray = [
  // Currency
  ["gold", { icon: "🏵️", name: "Gold", type: "currency" }],
  ["premium currency", { icon: "💎", name: "Premium Currency", type: "currency" }],

  // Material
  ["c material", { icon: "🔑", name: "C Material (★☆☆☆☆)", type: "material" }],
  ["r material", { icon: "🔑", name: "R Material (★★☆☆☆)", type: "material" }],
  ["ur material", { icon: "🔑", name: "UR Material (★★★☆☆)", type: "material" }],
  ["sr material", { icon: "🔑", name: "SR Material (★★★★☆)", type: "material" }],
  ["ssr material", { icon: "🔑", name: "SSR Material (★★★★★)", type: "material" }],
];

const itemsMap = new Map(itemsArray);

module.exports = {
  itemTypes,
  itemsArray,
  itemsMap,
};
