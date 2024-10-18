class ItemInfo {
  constructor(icon, name, type, description="No description yet.") {
    this.icon = icon;
    this.name = name;
    this.type = type;
    this.description = description;
  }
}

module.exports = ItemInfo;