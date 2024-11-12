const { createCanvas, loadImage } = require("canvas");
const { createCard } = require("./createCard");
const config = require("@config");

async function createCardGrid(cardUrls, borderPaths) {
  const cardWidth = 285 +30;
  const cardHeight = 400+30;
  // const cardWidth = config.cardWidth;
  // const cardHeight = config.cardHeight;
  const numColumns = 5;
  const numRows = 2;

  // Create a canvas to compose the grid of images
  const canvas = createCanvas(cardWidth * numColumns, cardHeight * numRows);
  const ctx = canvas.getContext("2d");

  // Array to store promises for image creation
  const createPromises = [];

  // Generate promises for creating images
  for (let i = 0; i < cardUrls.length; i++) {
    const row = Math.floor(i / numColumns);
    const col = i % numColumns;

    // Create card and sleeve image in parallel and draw onto canvas
    const createCardPromise = createCard(cardUrls[i], borderPaths[i])
      .then(async (imageBuffer) => {
        const img = await loadImage(imageBuffer);
        ctx.drawImage(img, col * cardWidth, row * cardHeight);
      })
      .catch((error) => {
        console.error(`Error creating card at row ${row}, column ${col}:`, error);
      });

    createPromises.push(createCardPromise);
  }

  // Wait for all promises to resolve using Promise.all
  await Promise.all(createPromises);

  // Convert the canvas to a buffer and return
  const gridImageBuffer = canvas.toBuffer("image/png");
  return gridImageBuffer;
}

module.exports = { createCardGrid };
