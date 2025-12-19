import sharp from "sharp";

const MAX_IMAGE_SIZE_MB = 4;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION = 2048;

export async function processImageForGemini(base64Data: string): Promise<string> {
  const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  const imageBuffer = Buffer.from(base64Image, 'base64');

  const metadata = await sharp(imageBuffer).metadata();
  const currentSize = imageBuffer.length;

  if (currentSize <= MAX_IMAGE_SIZE_BYTES && 
      (metadata.width || 0) <= MAX_DIMENSION && 
      (metadata.height || 0) <= MAX_DIMENSION) {
    return base64Data;
  }

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

export async function compositeOriginalObject(
  originalBase64: string, 
  generatedBase64: string, 
  maskBase64: string
): Promise<string> {
  try {
    const originalBuffer = Buffer.from(originalBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const generatedBuffer = Buffer.from(generatedBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');

    const originalMeta = await sharp(originalBuffer).metadata();
    const resizedGenerated = await sharp(generatedBuffer)
      .resize(originalMeta.width, originalMeta.height)
      .toBuffer();

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
      }])
      .jpeg({ quality: 90 })
      .toBuffer();

    return `data:image/jpeg;base64,${finalImage.toString('base64')}`;
  } catch (error) {
    console.error("Composition error:", error);
    return generatedBase64; 
  }
}

// === GEOMETRIC MANIPULATION HELPERS ===

// Crops to the center 50% for macro shots
export async function cropImage(base64Data: string): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    const cropWidth = Math.floor(width * 0.5); // Tighter crop (50%)
    const cropHeight = Math.floor(height * 0.5);
    const left = Math.floor((width - cropWidth) / 2);
    const top = Math.floor((height - cropHeight) / 2);

    const cropped = await sharp(buffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .toBuffer();

    return `data:image/jpeg;base64,${cropped.toString('base64')}`;
  } catch (e) {
    console.error("Crop failed", e);
    return base64Data;
  }
}

// Handles both "Zoom Out" (Symmetric) and "Shift/Angle" (Asymmetric)
export async function padImage(base64Data: string, mode: 'center' | 'right' = 'center'): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    let newWidth = width;
    let newHeight = height;
    let leftPad = 0;
    let topPad = 0;

    if (mode === 'center') {
      // Zoom Out: Add 50% padding on all sides
      newWidth = Math.floor(width * 1.5);
      newHeight = Math.floor(height * 1.5);
      leftPad = Math.floor((newWidth - width) / 2);
      topPad = Math.floor((newHeight - height) / 2);
    } else if (mode === 'right') {
      // Angle Shift: Add 50% padding ONLY to the right
      // This forces the object to the LEFT of the frame, suggesting a right-side angle
      newWidth = Math.floor(width * 1.5);
      leftPad = 0; // Keep object pinned to left
      topPad = 0;
    }

    const padded = await sharp(buffer)
      .extend({
        top: topPad,
        bottom: newHeight - height - topPad,
        left: leftPad,
        right: newWidth - width - leftPad,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White canvas for outpainting
      })
      .toBuffer();

    return `data:image/jpeg;base64,${padded.toString('base64')}`;
  } catch (e) {
    console.error("Pad failed", e);
    return base64Data;
  }
}