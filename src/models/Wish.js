class Wish {
  /**
   * Creates an instance of Wish.
   * @param {Object} object - The object containing character and series properties.
   * @param {string} object.character - The character name.
   * @param {string} object.series - The series name.
   * @throws {Error} Will throw an error if the object is invalid.
   */
  constructor(object) {
    if (!object || typeof object.character !== "string" || typeof object.series !== "string") {
      throw new Error("Invalid object parameter");
    }
    this.character = object.character;
    this.series = object.series;
  }
}

module.exports = Wish;
