const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_Id,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

/**
 * List images in the S3 bucket.
 * @returns {Promise<string[]>} List of image keys.
 */
async function listImages() {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: "your-directory-path/", // Optional: specify if you have a specific directory
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const imageKeys = data.Contents.map((item) => item.Key);
    return imageKeys;
  } catch (err) {
    console.error("Error fetching images from S3:", err);
    return [];
  }
}

/**
 * Get the CloudFront URL for a given S3 key.
 * @param {string} key - The S3 object key.
 * @returns {string} The CloudFront URL for the image.
 */
function getCloudFrontUrl(key) {
  return `${CLOUDFRONT_URL}/${key}`;
}

module.exports = {
  listImages,
  getCloudFrontUrl,
};
