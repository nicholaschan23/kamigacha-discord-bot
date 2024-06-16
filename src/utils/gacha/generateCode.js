const CounterModel = require("../../database/mongodb/models/card/counter");

async function getNextSequenceValue(client) {
  const sequenceDocument = await CounterModel(client).findByIdAndUpdate("cardCode", { $inc: { sequenceValue: 1 } }, { new: true, upsert: true });
  return sequenceDocument.sequenceValue;
}

function generateCodeFromNumber(number) {
  return number.toString(36);
}

async function generateUniqueCode() {
  let isValid = false;
  let cardCode;

  while (!isValid) {
    const sequenceValue = await getNextSequenceValue();
    cardCode = generateCodeFromNumber(sequenceValue);

    if (!containsInappropriateWords(cardCode)) {
      isValid = true;
    }
  }

  return cardCode;
}


const inappropriateWords = ["badword1", "badword2", "badword3"]; // Extend this list as needed

function containsInappropriateWords(code) {
  return inappropriateWords.some(word => code.includes(word));
}


async function generateUniqueCode() {
  let isValid = false;
  let cardCode;

  while (!isValid) {
    const sequenceValue = await getNextSequenceValue('cardCode');
    cardCode = generateCodeFromNumber(sequenceValue);

    if (!containsInappropriateWords(cardCode)) {
      isValid = true;
    }
  }

  return cardCode;
}
