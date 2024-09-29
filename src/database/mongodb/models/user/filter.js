const mongoose = require("mongoose");
const CollectionFilter = require("../../../../models/CollectionFilter");

/**
 * Schema for individual filter.
 * @typedef {Object} CollectionFilter
 * @property {string} emoji - The emoji representing the filter.
 * @property {string} label - The label or name for the filter.
 * @property {string} filter - The filter string used to apply the filter.
 */
const FilterSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    label: { type: String, required: true },
    filter: { type: String, required: true },
  },
  { _id: false }
);

const collectionFilterSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
  },

  /**
   * Collection filters list.
   * @type {CollectionFilter[]}
   */
  filterList: {
    type: [FilterSchema],
    default: () => [
      new CollectionFilter("🗓️", "Date", "order=date"),
      new CollectionFilter("🏷️", "Tagged", "tag!=none"),
      new CollectionFilter("▪️", "Untagged", "tag=none"),
      // new CollectionFilter(":heart:", "Wish", "order=wish"),
      // new CollectionFilter(":heart:", "Show Wish", "order=wish<>"),
    ],
  },
});

module.exports = mongoose.model("collection filter", collectionFilterSchema);
