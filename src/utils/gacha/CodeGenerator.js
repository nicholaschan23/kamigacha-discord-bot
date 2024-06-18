const CounterModel = require("../../database/mongodb/models/card/counter");

class CodeGenerator {
  constructor(client) {
    this.client = client;
    this.sequenceName = "cardCode";
  }

  async generateCode() {
    let isValid = false;
    let cardCode;

    while (!isValid) {
      const sequenceValue = await this.getNextSequenceValue(this.sequenceName);
      cardCode = this.generateCodeFromNumber(sequenceValue);

      if (!this.containsVowels(cardCode)) {
        isValid = true;
      }
    }

    return cardCode;
  }

  async getNextSequenceValue() {
    const sequenceDocument = await CounterModel(this.client).findByIdAndUpdate(this.sequenceName, { $inc: { sequenceValue: 1 } }, { new: true, upsert: true });
    return sequenceDocument.sequenceValue;
  }

  generateCodeFromNumber(number) {
    return number.toString(36);
  }  

  containsVowels(string) {
    const vowels = ["a", "e", "i", "o", "u"];
    return vowels.some((vowel) => string.includes(vowel));
  }
}

module.exports = CodeGenerator;
