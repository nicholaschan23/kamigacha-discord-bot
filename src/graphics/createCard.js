const sharp = require("sharp");
const axios = require("axios");
const config = require("@config");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");

async function fetchImage(url) {
  // Fetch the image from the URL
  const response = await axios({
    url: url,
    responseType: "arraybuffer",
  });
  return response.data;
}

async function createCard(cardUrl, borderPath) {
  borderPath = path.join(__dirname, "..", "..", "assets", "borders", "placeholder_border.png");
  const canvasWidth = 285; // 420
  const canvasHeight = 400; // 590
  const borderSize = 15;
  // const borderSize = config.cardBorder;
  // const canvasWidth = config.cardWidth;
  // const canvasHeight = config.cardHeight;

  // Fetch the card image, border image, and rarity icon in parallel
  const [cardData, borderData] = await Promise.all([fetchImage(cardUrl), sharp(borderPath).toBuffer()]);

  // Resize the images to fit the card dimensions
  const cardImage = sharp(cardData).resize(canvasWidth, canvasHeight);
  const borderImage = sharp(borderData).resize(canvasWidth, canvasHeight);

  // Convert the resized images to buffers in parallel
  const [cardBuffer, borderBuffer] = await Promise.all([cardImage.toBuffer(), borderImage.toBuffer()]);

  // Create a canvas to draw the card
  const canvas = createCanvas(canvasWidth + 2 * borderSize, canvasHeight + 2 * borderSize);
  const ctx = canvas.getContext("2d");

  // Load the images into the canvas
  const [cardImg, borderImg] = await Promise.all([loadImage(cardBuffer), loadImage(borderBuffer)]);

  // Create a rounded rectangle clipping path
  ctx.beginPath();
  roundedRect(ctx, borderSize, borderSize, canvasWidth, canvasHeight, 20);
  ctx.clip();

  // Draw the card image, border, and rarity icon onto the canvas
  ctx.drawImage(cardImg, borderSize, borderSize);
  ctx.drawImage(borderImg, borderSize, borderSize);

  // Return the final card image as a buffer
  return canvas.toBuffer("image/png");
}

// Function to create a rounded rectangle path
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

module.exports = { createCard };
