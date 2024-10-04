const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const binderListSchema = new Schema(
  {
    codes: [String],

    numberOfPages: {
      type: Number,
      default: 0,
    },
    pageWidth: Number,
    pageHeight: Number,

    numberOfCards: {
      type: Number,
      default: 0,
    },

    // If binder is used to track completing a card set
    isTracker: {
      type: Boolean,
      required: true,
    },
    series: String,
    set: Number,
  },
  { _id: false }
);

const binderSchema = new Schema(
  {
    userId: {
      type: String,
      unique: true,
      required: true,
    },

    // Map of card codes to { binder name, page, slot }
    codesUsed: {
      type: Map,
      of: String,
      default: new Map(),
    },

    // Map of binder names to binder objects
    binderList: {
      type: Map,
      of: binderListSchema,
    },
  },
  { _id: false }
);

module.exports = mongoose.model("binder", binderSchema);
