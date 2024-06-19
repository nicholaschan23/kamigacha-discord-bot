const mongoose = require("mongoose");

const totalCardsPulledSchema = new mongoose.Schema(
  {
    C: {
      type: Number,
      default: 0,
    },
    R: {
      type: Number,
      default: 0,
    },
    UR: {
      type: Number,
      default: 0,
    },
    SR: {
      type: Number,
      default: 0,
    },
    SSR: {
      type: Number,
      default: 0,
    },
    UGC: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

module.exports = totalCardsPulledSchema;
