const fs = require("fs").promises;
const path = require("path");
const Logger = require("../Logger");
const logger = new Logger("Create card image");
const sharp = require("sharp");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Define the canvas dimensions and border size
const canvasWidth = 800;
// const canvasWidth = 274;
const canvasHeight = 800;
// const canvasHeight = 405;
const border = 20;

// Function to fetch an image from a URL and return it as a buffer
async function fetchImageBuffer(url, targetWidth, targetHeight) {
  // Fetch image from URL as a buffer
  const response = await axios({
    url,
    responseType: "arraybuffer",
  });

  // Convert the response data to a buffer
  const buffer = Buffer.from(response.data, "binary");

  if (targetWidth && targetHeight) {
    return buffer;
  }

  // Resize the image buffer to the specified dimensions
  const resizedImage = await sharp(buffer)
    .resize({
      width: targetWidth,
      height: targetHeight,
      fit: "inside", // Maintain aspect ratio and fit inside the specified dimensions
      withoutEnlargement: true, // Don't enlarge images smaller than the specified dimensions
    })
    .toBuffer();

  return resizedImage;
}

async function createCardImage(cardImage, sleeveImage) {
  // Create a blank transparent background
  const blankImage = Buffer.from(
    `<svg width="${canvasWidth}" height="${canvasHeight}">
    <rect width="100%" height="100%" fill="none" />
  </svg>`
  );

  const [cardBuffer, sleeveBuffer] = await Promise.all([fetchImageBuffer(cardImage), fetchImageBuffer(sleeveImage)]);

  const buffer = await sharp(blankImage)
    .composite([
      {
        input: cardBuffer,
        left: border,
        top: border,
      },
      {
        input: sleeveBuffer,
        left: border,
        top: border,
      },
    ])
    .png()
    .toBuffer();

  return buffer;
}

// Function to overlay a PNG over a JPG
async function overlayImages(jpgUrl, pngUrl) {
  const [jpgBuffer, pngBuffer] = await Promise.all([fetchImageBuffer(jpgUrl, 100, 100), fetchImageBuffer(pngUrl)]);

  const jpgImage = sharp(jpgBuffer);

  const buffer = await jpgImage
    .composite([
      {
        input: pngBuffer,
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  const filePath = path.join(__dirname, "../../database/aws/images/cards", path.basename(jpgUrl));

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer, { flag: "w" }, () => {});
  return filePath;
}

async function createCardGrid(imageUrls, rows = 2, columns = 5) {
  if (imageUrls.length !== rows * columns) {
    throw new Error(`Expected ${rows * columns} image URLs, but got ${imageUrls.length}`);
  }

  const buffers = await Promise.all(imageUrls.map((url) => fetchImageBuffer(url, 289, 400)));
  const imageMetadata = await sharp(buffers[0]).metadata();
  const imageWidth = imageMetadata.width;
  const imageHeight = imageMetadata.height;
  const canvasWidth = imageWidth * columns;
  const canvasHeight = imageHeight * rows;

  let compositeList = [];

  for (let i = 0; i < buffers.length; i++) {
    const x = (i % columns) * imageWidth;
    const y = Math.floor(i / columns) * imageHeight;
    compositeList.push({
      input: buffers[i],
      left: x,
      top: y,
    });
  }

  const gridBuffer = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeList)
    .png()
    .toBuffer();

  const tempFileName = `multipull-${uuidv4()}.png`;
  const filePath = path.join(__dirname, "../../database/aws/images/cards", tempFileName);
  await fs.writeFile(filePath, gridBuffer, { flag: "w" }, () => {});

  return filePath;
}

module.exports = { createCardImage, overlayImages, createCardGrid };
