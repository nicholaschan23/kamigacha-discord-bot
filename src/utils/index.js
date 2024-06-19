const Logger = require("./Logger");
const delay = require("./delay");
const fileSystem = require("./fileSystem");

// Import the utils directory to have access to all these modules
module.exports = {
  Logger,
  ...fileSystem,
  ...delay,
};
