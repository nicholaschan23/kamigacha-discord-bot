const sharp = require("sharp");
const axios = require("axios");
const config = require("../../config");

async function fetchImage(url) {
  // Fetch the image from the URL
  const response = await axios({
    url: url,
    responseType: "arraybuffer",
  });
  return response;
}

async function createCard(cardUrl, sleeveUrl) {
  const canvasWidth = config.cardWidth;
  const canvasHeight = config.cardHeight;
  const borderSize = config.cardBorder;
  const [card, sleeve] = await Promise.all([fetchImage(cardUrl), fetchImage(sleeveUrl)]);

  // Convert the image buffer to a Sharp instance
  const cardImage = sharp(card.data);
  const sleeveImage = sharp(sleeve.data);

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
      // {
      //   input: await sleeveImage
      //     .resize({
      //       width: canvasWidth - 2 * borderSize,
      //       height: canvasHeight - 2 * borderSize,
      //     })
      //     .png()
      //     .toBuffer(),
      //   top: borderSize,
      //   left: borderSize,
      //   blend: "over",
      // },
    ])
    .png()
    .toBuffer();

  return overlaidImage;
}

module.exports = { createCard };
