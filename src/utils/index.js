const Logger = require("./logger");
const fileSystem = require("./fileSystem");
const delay = require("./delay");

// Import the utils directory to have access to all these modules
module.exports = {
  Logger,
  ...fileSystem,
  ...delay,
};
