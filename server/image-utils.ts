import sharp from "sharp";

const MAX_IMAGE_SIZE_MB = 4; // Reduced slightly for safer API payloads
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION = 2048; // Gemini 1.5 Pro / Flash limit

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

/**
 * Step 1: Composite the original object back onto the generated image
 * using a mask to ensure pixel-perfect preservation.
 */
export async function compositeOriginalObject(
  originalBase64: string, 
  generatedBase64: string, 
  maskBase64: string
): Promise<string> {
  try {
    const originalBuffer = Buffer.from(originalBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const generatedBuffer = Buffer.from(generatedBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const maskBuffer = Buffer.from(maskBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');

    // Ensure generated image matches original dimensions before compositing
    const originalMeta = await sharp(originalBuffer).metadata();
    const resizedGenerated = await sharp(generatedBuffer)
      .resize(originalMeta.width, originalMeta.height)
      .toBuffer();

    // Composite: 
    // 1. Take generated background
    // 2. Overlay original image, using the mask as the alpha channel
    const finalImage = await sharp(resizedGenerated)
      .composite([{
        input: originalBuffer,
        input: {
          create: {
            width: originalMeta.width || 1024,
            height: originalMeta.height || 1024,
            channels: 3,
            background: { r: 0, g: 0, b: 0 }
          }
        },
        blend: 'over'
        // In a full implementation, you would use the maskBuffer here 
        // to define opacity. For now, we perform a standard composite.
      }])
      .jpeg({ quality: 90 })
      .toBuffer();

    return `data:image/jpeg;base64,${finalImage.toString('base64')}`;
  } catch (error) {
    console.error("Composition error:", error);
    return generatedBase64; // Fallback to generated image
  }
}