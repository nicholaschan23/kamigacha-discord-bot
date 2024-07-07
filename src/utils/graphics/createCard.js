const sharp = require("sharp");
const axios = require("axios");
const config = require("../../config");

async function fetchImage(url) {
  // Fetch the image from the URL
  const response = await axios({
    url: url,
    responseType: "arraybuffer",
  });
  return response.data;
}

async function createCard(cardUrl, borderPath) {
  const canvasWidth = config.cardWidth;
  const canvasHeight = config.cardHeight;
  const borderSize = config.cardBorder;

  // Fetch the card image and read the border image from the local filesystem
  const [cardData, borderData] = await Promise.all([fetchImage(cardUrl), sharp(borderPath).toBuffer()]);
  
  // Convert the image buffer to a Sharp instance
  const cardImage = sharp(cardData);
  const borderImage = sharp(borderData);

  // Resize the image and chain operations
  const overlaidImage = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4, // 4 channels for RGBA
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
    },
  })
    .composite([
      {
        input: await cardImage
          .resize({
            width: canvasWidth - 2 * borderSize,
            height: canvasHeight - 2 * borderSize,
          })
          .png()
          .toBuffer(),
        top: borderSize,
        left: borderSize,
        blend: "over",
      },
      {
        input: await borderImage
          .png()
          .toBuffer(),
        top: 0,
        left: 0,
        blend: "over",
      },
    ])
    .png()
    .toBuffer();

  return overlaidImage;
}

module.exports = { createCard };
