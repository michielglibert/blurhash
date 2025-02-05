const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { encode, decode } = require("blurhash");

// Function to generate BlurHash
async function generateBlurHash(imagePath) {
  const image = await sharp(imagePath);
  const { data, info } = await image
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const blurHash = encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4, // Component X
    4 // Component Y
  );

  return { blurHash, width: info.width, height: info.height };
}

// Function to convert BlurHash to base64 image
async function blurHashToBase64(
  blurHash,
  originalWidth,
  originalHeight,
  targetWidth = 32
) {
  // Calculate the target height while maintaining the aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  const targetHeight = Math.round(targetWidth / aspectRatio);

  const pixels = decode(blurHash, targetWidth, targetHeight);
  const imageBuffer = Buffer.from(pixels);

  const base64Image = await sharp(imageBuffer, {
    raw: {
      width: targetWidth,
      height: targetHeight,
      channels: 4,
    },
  })
    .jpeg()
    .toBuffer();

  return `data:image/jpeg;base64,${base64Image.toString("base64")}`;
}

// Main function to process all jpg images in the current directory and output the results to a text file
async function processImagesInDirectory() {
  const directoryPath = __dirname;
  const files = fs.readdirSync(directoryPath);
  const jpgFiles = files.filter(
    (file) => path.extname(file).toLowerCase() === ".jpg"
  );

  if (jpgFiles.length === 0) {
    console.error("No .jpg files found in the current directory.");
    return;
  }

  let output = "";

  for (const file of jpgFiles) {
    try {
      const imagePath = path.join(directoryPath, file);
      const { blurHash, width, height } = await generateBlurHash(imagePath);
      console.log("Processing:", file);

      const base64Image = await blurHashToBase64(blurHash, width, height);
      output += `${file} - ${base64Image}\n`;
    } catch (error) {
      console.error("Error processing image:", file, error);
    }
  }

  fs.writeFileSync("output.txt", output, "utf8");
  console.log("output.txt file has been generated.");
}

// Process all jpg images in the current directory
processImagesInDirectory();
