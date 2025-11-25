import sharp from "sharp";

const MAX_IMAGE_SIZE_MB = 8;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION = 2048;

export async function processImageForGemini(base64Data: string): Promise<string> {
  // Remove data URL prefix if present
  const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  const imageBuffer = Buffer.from(base64Image, 'base64');

  // Check if image needs resizing
  const metadata = await sharp(imageBuffer).metadata();
  const currentSize = imageBuffer.length;

  if (currentSize <= MAX_IMAGE_SIZE_BYTES && 
      (metadata.width || 0) <= MAX_DIMENSION && 
      (metadata.height || 0) <= MAX_DIMENSION) {
    return base64Data;
  }

  // Resize if needed
  let resizedBuffer = imageBuffer;
  if ((metadata.width || 0) > MAX_DIMENSION || (metadata.height || 0) > MAX_DIMENSION) {
    resizedBuffer = await sharp(imageBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  // If still too large, reduce quality
  if (resizedBuffer.length > MAX_IMAGE_SIZE_BYTES) {
    let quality = 80;
    while (resizedBuffer.length > MAX_IMAGE_SIZE_BYTES && quality > 30) {
      resizedBuffer = await sharp(imageBuffer)
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toBuffer();
      quality -= 10;
    }
  }

  return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
}
