class InventoryManager {
  constructor() {
    this.inventory = [];
  }

  addItem(item, quantity = 1) {
    const existingItem = this.inventory.find(i => i.name === item);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.inventory.push({ name: item, quantity });
    }
  }

  removeItem(item, quantity = 1) {
    const existingItem = this.inventory.find(i => i.name === item);
    if (existingItem) {
      existingItem.quantity -= quantity;
      if (existingItem.quantity <= 0) {
        this.inventory = this.inventory.filter(i => i.name !== item);
      }
    } else {
      // console.log(`Item ${item} not found in inventory.`);
    }
  }

  getItemQuantity(item) {
    const existingItem = this.inventory.find(i => i.name === item);
    return existingItem ? existingItem.quantity : 0;
  }

  getInventory() {
    return this.inventory;
  }

  sortInventory() {
    const sorted = this.inventory.sort((a, b) => {
      const typeA = this.getItemType(a.name);
      const typeB = this.getItemType(b.name);

      const typeComparison = this.getTypeIndex(typeA) - this.getTypeIndex(typeB);
      if (typeComparison !== 0) {
        return typeComparison;
      }

      const quantityComparison = b.quantity - a.quantity;
      if (quantityComparison !== 0) {
        return quantityComparison;
      }

      return a.name.localeCompare(b.name);
    });

    this.inventory = sorted;
  }

  getItemType() {
    return "defaultType";
  }

  getTypeIndex(type) {
    const predefinedOrder = ["type1", "type2", "type3"];
    return predefinedOrder.indexOf(type);
  }
}

export default InventoryManager;
