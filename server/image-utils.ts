import sharp from "sharp";

// [FIXED] Robust Base64 decoder that handles spaces/newlines/different headers safely
function decodeBase64(dataString: string) {
  // If it contains a comma, it's a Data URL (e.g. "data:image/png;base64,....")
  // We just want the part AFTER the comma.
  if (dataString.includes(',')) {
    const parts = dataString.split(',');
    return Buffer.from(parts[1], 'base64');
  }
  // Otherwise, assume it's already a raw base64 string
  return Buffer.from(dataString, 'base64');
}

export async function processImageForGemini(imageData: string): Promise<string> {
  const buffer = decodeBase64(imageData);

  // Resize to max 1024x1024 to avoid token limits, preserve aspect ratio
  const processedBuffer = await sharp(buffer)
    .resize(1024, 1024, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .toFormat('jpeg', { quality: 90 })
    .toBuffer();

  return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
}

export async function cropImage(imageData: string, width: number, height: number): Promise<string> {
  const buffer = decodeBase64(imageData);
  const processedBuffer = await sharp(buffer)
    .resize(width, height, { fit: 'cover' })
    .toBuffer();
  return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
}

export async function padImage(imageData: string, padding: number): Promise<string> {
  const buffer = decodeBase64(imageData);
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) return imageData;

  const processedBuffer = await sharp(buffer)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toBuffer();

  return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
}

/**
 * Applies a perspective distortion to simulate different camera angles.
 * Used to "hint" the AI about the desired 3D view before generation.
 */
export async function applyPerspectiveMockup(
  imageData: string, 
  viewAngle: "Original" | "Front" | "Side" | "Top", 
  zoomLevel: number = 100
): Promise<string> {

  if (viewAngle === "Original" && zoomLevel === 100) return imageData;

  const buffer = decodeBase64(imageData);
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const w = metadata.width || 1024;
  const h = metadata.height || 1024;

  let pipeline = image;

  // 1. Handle Zoom (Crop center)
  if (zoomLevel > 100) {
    const factor = 100 / zoomLevel; // e.g. 0.5 for 200% zoom
    const newW = Math.round(w * factor);
    const newH = Math.round(h * factor);
    const left = Math.round((w - newW) / 2);
    const top = Math.round((h - newH) / 2);

    pipeline = pipeline.extract({ left, top, width: newW, height: newH }).resize(w, h);
  } 
  else if (zoomLevel < 100) {
    // Zoom out = Pad with white
    const factor = 100 / zoomLevel; // e.g. 2.0 for 50% zoom
    const targetW = Math.round(w * factor);
    const targetH = Math.round(h * factor);
    const padX = Math.round((targetW - w) / 2);
    const padY = Math.round((targetH - h) / 2);

    pipeline = pipeline.extend({
      top: padY, bottom: padY, left: padX, right: padX,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    });
  }

  // 2. Handle Perspective Mockups (Composite over background)
  if (viewAngle === "Side") {
    // Create a white canvas 20% wider
    const canvasW = Math.round(w * 1.2);
    const canvasH = h;

    // Resize image to be slightly narrower to simulate angle
    const skewedW = Math.round(w * 0.85); 

    const skewedImage = await pipeline
      .resize(skewedW, h)
      .toBuffer();

    // Composite: Place image to the right to imply looking from the left
    const finalBuffer = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{
      input: skewedImage,
      left: canvasW - skewedW, // Align right
      top: 0
    }])
    .jpeg()
    .toBuffer();

    return `data:image/jpeg;base64,${finalBuffer.toString('base64')}`;
  }

  // Default / Front / Top (Clean passthrough)
  const output = await pipeline.toBuffer();
  return `data:image/jpeg;base64,${output.toString('base64')}`;
}