class SeriesResult {
  constructor(series, totalWishCount, totalCharacters) {
    this.series = series;
    this.totalWishCount = totalWishCount;
    this.totalCharacters = totalCharacters;
    this.frequency = 0;
  }
}

module.exports = SeriesResult;
