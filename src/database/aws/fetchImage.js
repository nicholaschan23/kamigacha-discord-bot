const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

/**
 * Get the CloudFront URL for a given S3 key.
 * @param {string} key - The S3 object key.
 * @returns {string} The CloudFront URL for the image.
 */
function fetchImage(key) {
  return `${CLOUDFRONT_URL}/${key}`;
}

module.exports = fetchImage;
