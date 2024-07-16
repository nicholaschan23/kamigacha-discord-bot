const LookupButtonPages = require("./LookupButtonPages");

class WishlistAddButtonPages extends LookupButtonPages {
  constructor(interaction, results) {
    super(interaction, results);
  }

  async handleSelect(interaction, value) {
    console.log(interaction)
    console.log(value)
    return;
  }
}

module.exports = WishlistAddButtonPages;
