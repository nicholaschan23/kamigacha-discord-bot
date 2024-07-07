const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
const s3Client = require("./s3Client");
const Logger = require("../../utils/Logger");
const logger = new Logger("AWS list objects");

async function listObjects(prefix) {
  let isTruncated = true;
  let continuationToken;
  const allKeys = [];

  while (isTruncated) {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    };

    try {
      const response = await s3Client.send(new ListObjectsV2Command(params));
      response.Contents.forEach((item) => {
        allKeys.push(item.Key);
      });

      isTruncated = response.IsTruncated;
      if (isTruncated) {
        continuationToken = response.NextContinuationToken;
      }
    } catch (error) {
      logger.error(error.stack);
      throw error;
    }
  }

  return allKeys;
}

module.exports = { listObjects };
