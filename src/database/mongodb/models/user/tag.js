const mongoose = require("mongoose");
const CollectionTag = require("../../../../models/CollectionTag")

const TagSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true },
    emoji: { type: String, required: true },
    quantity: { type: Number, default: 0 },
  },
  { _id: false }
);

const collectionTagSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
  },

  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false,
  },

  tagLimit: {
    type: Number,
    default: 25,
  },

  /**
   * Collection tags list.
   * @type {CollectionTag[]}
   */
  tagList: [TagSchema],
});

module.exports = () => {
  const client = require("../../../../../bot");
  return client.userDB.model("collection tag", collectionTagSchema);
};
