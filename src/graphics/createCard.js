const sharp = require("sharp");
const axios = require("axios");
const config = require("@config");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const fs = require("fs");

async function fetchImage(url) {
  // Fetch the image from the URL
  const response = await axios({
    url: url,
    responseType: "arraybuffer",
  });
  return response.data;
}

async function createCard(cardUrl, borderPath, name = "TEST", rarityIconPath = path.resolve(__dirname, "../../assets/game-badge.png")) {
  // Add the card name text

  const canvasWidth = config.cardWidth;
  const canvasHeight = config.cardHeight;
  const borderSize = config.cardBorder;

  // Fetch the card image, border image, and rarity icon in parallel
  const [cardData, borderData, rarityIconData] = await Promise.all([fetchImage(cardUrl), sharp(borderPath).toBuffer(), sharp(rarityIconPath).toBuffer()]);

  // Resize the images to fit the card dimensions
  const cardImage = sharp(cardData).resize(canvasWidth, canvasHeight);
  const borderImage = sharp(borderData).resize(canvasWidth, canvasHeight);
  const rarityIconImage = sharp(rarityIconData).resize(50, 50); // Adjust size as needed

  // Convert the resized images to buffers in parallel
  const [cardBuffer, borderBuffer, rarityIconBuffer] = await Promise.all([cardImage.toBuffer(), borderImage.toBuffer(), rarityIconImage.toBuffer()]);

  // Create a canvas to draw the card
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Load the images into the canvas
  const [cardImg, borderImg, rarityIconImg] = await Promise.all([loadImage(cardBuffer), loadImage(borderBuffer), loadImage(rarityIconBuffer)]);

  // Draw the card image, border, and rarity icon onto the canvas
  ctx.drawImage(cardImg, 0, 0);
  ctx.drawImage(borderImg, 0, 0);
  ctx.drawImage(rarityIconImg, canvasWidth - 60, 10); // Position the icon

  ctx.font = `40px san-serif`
  ctx.fillStyle = "white";
  ctx.fillText(name, 10, canvasHeight - 50);

  // Draw text with each font variant
  fonts.forEach((font, index) => {
    ctx.font = `40px '${font.family}'`;
    ctx.fillStyle = "white";
    ctx.fillText(`${font.style} Text`, 10, 50 + index * 60);
  });

  // Return the final card image as a buffer
  return canvas.toBuffer("image/png");
}

module.exports = { createCard };
