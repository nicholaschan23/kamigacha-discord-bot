const { ensureDirExists, fileExists } = require("../../utils/fileSystem");
const { listObjects } = require("./listObjects");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("./s3Client");
const fsp = require("fs").promises;
const path = require("path");
const Logger = require("../../utils/Logger");
const logger = new Logger("Download files");

async function downloadFile(key, localBasePath) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  const command = new GetObjectCommand(params);
  const data = await s3Client.send(command);

  const localFilePath = path.join(localBasePath, key);

  // Ensure the directory exists
  await ensureDirExists(localFilePath);

  // Read the stream to a buffer
  const bodyContents = await streamToBuffer(data.Body);

  // Write the buffer to a file
  await fsp.writeFile(localFilePath, bodyContents);
}

// Utility function to convert a stream to a buffer
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function downloadFiles(keyPrefix, localBasePath) {
  const keys = await listObjects(keyPrefix);

  const downloadPromises = keys.map(async (key) => {
    const localFilePath = path.join(localBasePath, key);
    const exists = await fileExists(localFilePath);

    if (!exists) {
      await downloadFile(key, localBasePath);
      logger.success(`Downloaded: ${path.basename(key)}`);
    } else {
      logger.info(`Located: ${path.basename(key)}`);
    }
  });
  await Promise.all(downloadPromises);
}

module.exports = { downloadFiles };
