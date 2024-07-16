const CounterModel = require("../../database/mongodb/models/card/counter");

class CodeGenerator {
  constructor(client) {
    this.client = client;
    this.sequenceName = "cardCode";
  }

  async getNewCode() {
    const sequenceValue = await this.getNextSequenceValue();
    return this.generateCodeFromNumber(sequenceValue);
  }

  async getNextSequenceValue() {
    const sequenceDocument = await CounterModel().findByIdAndUpdate(this.sequenceName, { $inc: { sequenceValue: 1 } }, { new: true, upsert: true });
    return sequenceDocument.sequenceValue;
  }

  // Function to convert a number to base 31 (base 36 without vowels)
  generateCodeFromNumber(num) {
    const base31Chars = "0123456789bcdfghjklmnpqrstvwxyz";
    if (num === 0) return "0";

    let result = "";
    const base = base31Chars.length;

    while (num > 0) {
      result = base31Chars[num % base] + result;
      num = Math.floor(num / base);
    }
    return result;
  }
}

module.exports = CodeGenerator;
