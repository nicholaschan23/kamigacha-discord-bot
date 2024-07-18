/**
 * Delay execution by a specified number of milliseconds.
 *
 * @param {Number} ms - The number of milliseconds to delay.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { delay };
