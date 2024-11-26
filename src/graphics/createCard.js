const sharp = require("sharp");
const axios = require("axios");
const config = require("@config");
const { createCanvas, loadImage } = require("canvas");
const MapCache = require("@database/redis/cache/map");
const { getCardBorder } = require("@graphics/getCardBorder");

const cardWidth = config.cardWidth;
const cardHeight = config.cardHeight;
const borderSize = config.cardBorder;
const transparentSize = 15;
const canvasWidth = cardWidth + 2 * transparentSize;
const canvasHeight = cardHeight + 2 * transparentSize;

async function createCard(cardInfo) {
  const cardUrl = cardInfo.image;
  const borderPath = getCardBorder(cardInfo.rarity)

  // Fetch the card image, border image, and rarity icon in parallel
  const [cardData, borderData] = await Promise.all([fetchImage(cardUrl), sharp(borderPath).toBuffer()]);

  // Get metadata of the card image
  // const cardMetadata = await sharp(cardData).metadata();
  // const borderMetadata = await sharp(borderData).metadata();

  // Resize the images to fit the card dimensions if necessary
  const cardImage = sharp(cardData);
  const borderImage = sharp(borderData);

  // Convert the resized images to buffers in parallel
  const [cardBuffer, borderBuffer] = await Promise.all([cardImage.toBuffer(), borderImage.toBuffer()]);

  // Create a canvas to draw the card
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Load the images into the canvas
  const [cardImg, borderImg] = await Promise.all([loadImage(cardBuffer), loadImage(borderBuffer)]);

  ctx.drawImage(cardImg, transparentSize + borderSize, transparentSize + borderSize);
  ctx.drawImage(borderImg, transparentSize, transparentSize);

  // Draw frame image

  await addTextElements(ctx, cardInfo);

  // Return the final card image as a buffer
  return canvas.toBuffer("image/png");
}

// Function to add text elements to the card
async function addTextElements(ctx, cardInfo) {
  const maxWidth = cardWidth - transparentSize * 2 - 4 * borderSize;
  const maxHeight = 115 - 2 * borderSize;

  const textConfig = [
    {
      text: await MapCache.getFormattedCharacter(cardInfo.character),
      x: canvasWidth / 2,
      y: transparentSize + borderSize + 115 - borderSize,
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      fontSize: 40,
      fontFamily: "Futura",
      fontWeight: "bold",
    },
    {
      text: await MapCache.getFormattedSeries(cardInfo.series),
      x: canvasWidth / 2,
      y: cardHeight - transparentSize - 2.5 * borderSize,
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      fontSize: 40,
      fontFamily: "Futura",
      fontWeight: "bold",
    },
    // {
    //   text: `Year: ${cardInfo.year}`,
    //   x: borderSize + 10,
    //   y: cardHeight - borderSize - 60,
    //   maxWidth: cardWidth - 20,
    //   maxHeight: 20,
    //   fontSize: 16,
    //   fontFamily: "Arial",
    // },
    // {
    //   text: `Artist: ${cardInfo.artist}`,
    //   x: borderSize + 10,
    //   y: cardHeight - borderSize - 30,
    //   maxWidth: cardWidth - 20,
    //   maxHeight: 20,
    //   fontSize: 16,
    //   fontFamily: "Arial",
    // },
  ];

  textConfig.forEach((config) => {
    renderText(ctx, config);
  });
}

// Helper function to render text within a region
function renderText(ctx, config) {
  const { text, x, y, maxWidth, maxHeight, fontFamily, fontWeight = "normal" } = config;

  let fontSize = config.fontSize;
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";

  let lines = wrapText(ctx, text, maxWidth);
  let totalHeight = fontSize + (lines.length - 1) * fontSize * 1.2;

  // Adjust font size if text exceeds maxHeight
  while (totalHeight > maxHeight && fontSize > 10) {
    fontSize -= 1;
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
    lines = wrapText(ctx, text, maxWidth);
    totalHeight = fontSize + (lines.length - 1) * fontSize * 1.2;
  }

  // Adjust the starting y position so that the text ends at the specified y coordinate
  let startY = y - (maxHeight - totalHeight) / 2 - (lines.length - 1) * fontSize * 1.2;

  // Set text styles
  ctx.fillStyle = "#FFFFFF"; // Text color
  // ctx.fillStyle = "#000000"; // Text color
  ctx.strokeStyle = "#FFFFFF"; // Outline color
  ctx.lineWidth = 2; // Outline width

  // Add shadow if needed
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; // Shadow color
  ctx.shadowBlur = 4; // Shadow blur
  ctx.shadowOffsetX = 2; // Shadow X offset
  ctx.shadowOffsetY = 2; // Shadow Y offset

  // Draw the region for debugging
  // ctx.strokeStyle = "red";
  // ctx.lineWidth = 1;
  // ctx.strokeRect(x - maxWidth / 2, y, maxWidth, -maxHeight);

  // Draw text lines
  lines.forEach((line) => {
    ctx.strokeText(line, x, startY); // Draw outline
    ctx.fillText(line, x, startY);
    startY += fontSize * 1.2;
  });
}

// Helper function to wrap text
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  let lines = [];
  let line = words[0]; // Initialize the line with the first word

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = line + " " + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(line);
      line = word; // Start a new line with the current word
    } else {
      line = testLine;
    }
  }
  lines.push(line); // Push the last line
  return lines;
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

async function fetchImage(url) {
  // Fetch the image from the URL
  const response = await axios({
    url: url,
    responseType: "arraybuffer",
  });
  return response.data;
}

module.exports = { createCard };
