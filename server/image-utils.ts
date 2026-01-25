import sharp from "sharp";

// Robust Base64 decoder
function decodeBase64(dataString: string) {
  if (dataString.includes(',')) {
    const parts = dataString.split(',');
    return Buffer.from(parts[1], 'base64');
  }
  return Buffer.from(dataString, 'base64');
}

export async function processImageForGemini(imageData: string): Promise<string> {
  const buffer = decodeBase64(imageData);

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

// [NEW] Logic to prepare input image for Room Design based on detected object size
export async function applySmartObjectZoom(
  imageData: string,
  box: number[], // [ymin, xmin, ymax, xmax] (0-1000)
  targetFillRatio: number // e.g., 80%
): Promise<string> {
  const buffer = decodeBase64(imageData);
  const metadata = await sharp(buffer).metadata();
  const imgW = metadata.width!;
  const imgH = metadata.height!;

  const [ymin, xmin, ymax, xmax] = box;

  // 1. Calculate Product Dimensions in Pixels
  const prodW = ((xmax - xmin) / 1000) * imgW;
  const prodH = ((ymax - ymin) / 1000) * imgH;
  const prodCenterX = ((xmin + xmax) / 2000) * imgW;
  const prodCenterY = ((ymin + ymax) / 2000) * imgH;

  // 2. Calculate Target Canvas Size based on Fill Ratio
  // If we want product to be 80% of width: TargetW = ProdW / 0.8
  const targetCanvasW = prodW / (targetFillRatio / 100);

  // Maintain original aspect ratio for the generation input
  const aspect = imgW / imgH;
  const targetCanvasH = targetCanvasW / aspect;

  // 3. Define Extraction Region (Virtual)
  const cropLeft = Math.round(prodCenterX - (targetCanvasW / 2));
  const cropTop = Math.round(prodCenterY - (targetCanvasH / 2));
  const cropW = Math.round(targetCanvasW);
  const cropH = Math.round(targetCanvasH);

  // 4. Handle Zoom In vs Zoom Out
  // If targetCanvas < img (Zoom In), we crop.
  // If targetCanvas > img (Zoom Out), we pad.

  // We use the same composite logic as Smart Crop to handle both safely
  // but we extract intersection first to be efficient

  const srcLeft = Math.max(0, cropLeft);
  const srcTop = Math.max(0, cropTop);
  const srcRight = Math.min(imgW, cropLeft + cropW);
  const srcBottom = Math.min(imgH, cropTop + cropH);

  const srcWidth = srcRight - srcLeft;
  const srcHeight = srcBottom - srcTop;

  // Fallback if calculation fails
  if (srcWidth <= 0 || srcHeight <= 0) return imageData;

  const extractedPiece = await sharp(buffer)
    .extract({ left: srcLeft, top: srcTop, width: srcWidth, height: srcHeight })
    .toBuffer();

  const destLeft = srcLeft - cropLeft;
  const destTop = srcTop - cropTop;

  const canvas = await sharp({
    create: {
      width: cropW,
      height: cropH,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 } // White padding for outpainting
    }
  })
  .composite([{
    input: extractedPiece,
    top: Math.max(0, destTop),
    left: Math.max(0, destLeft)
  }])
  .jpeg()
  .toBuffer();

  return `data:image/jpeg;base64,${canvas.toString('base64')}`;
}

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

  if (zoomLevel > 100) {
    const factor = 100 / zoomLevel; 
    const newW = Math.round(w * factor);
    const newH = Math.round(h * factor);
    const left = Math.round((w - newW) / 2);
    const top = Math.round((h - newH) / 2);

    pipeline = pipeline.extract({ left, top, width: newW, height: newH }).resize(w, h);
  } 
  else if (zoomLevel < 100) {
    const factor = 100 / zoomLevel;
    const targetW = Math.round(w * factor);
    const targetH = Math.round(h * factor);
    const padX = Math.round((targetW - w) / 2);
    const padY = Math.round((targetH - h) / 2);

    pipeline = pipeline.extend({
      top: padY, bottom: padY, left: padX, right: padX,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    });
  }

  if (viewAngle === "Side") {
    const canvasW = Math.round(w * 1.2);
    const canvasH = h;
    const skewedW = Math.round(w * 0.85); 

    const skewedImage = await pipeline
      .resize(skewedW, h)
      .toBuffer();

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
      left: canvasW - skewedW, 
      top: 0
    }])
    .jpeg()
    .toBuffer();

    return `data:image/jpeg;base64,${finalBuffer.toString('base64')}`;
  }

  const output = await pipeline.toBuffer();
  return `data:image/jpeg;base64,${output.toString('base64')}`;
}

/**
 * Prepare an image for outpainting by extending it with grey padding
 * to match the target aspect ratio. The AI treats grey as "unrendered space" to be filled.
 */
export async function prepareOutpaintCanvas(
  imageData: string,
  targetAspectRatio: string // "1:1", "16:9", "4:5", "9:16"
): Promise<string> {
  // Remove header if present
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width!;
  const height = metadata.height!;
  const currentRatio = width / height;

  let targetRatioNum = 1;
  const [w, h] = targetAspectRatio.split(':').map(Number);
  if (w && h) targetRatioNum = w / h;

  let newWidth = width;
  let newHeight = height;

  // Calculate new dimensions to ENCLOSE the original image
  if (targetRatioNum > currentRatio) {
    // Target is wider (e.g. Portrait -> Landscape): Height stays same, Width increases
    newWidth = Math.round(height * targetRatioNum);
  } else {
    // Target is taller (e.g. Landscape -> Square): Width stays same, Height increases
    newHeight = Math.round(width / targetRatioNum);
  }

  // Calculate padding (centering the image)
  const padX = Math.max(0, Math.round((newWidth - width) / 2));
  const padY = Math.max(0, Math.round((newHeight - height) / 2));

  // Create the canvas with neutral grey background
  // The AI treats grey as "unrendered space" to be filled
  const canvas = await sharp(buffer)
    .extend({
      top: padY,
      bottom: padY,
      left: padX,
      right: padX,
      background: { r: 128, g: 128, b: 128, alpha: 1 } 
    })
    .toFormat("png")
    .toBuffer();

  return `data:image/png;base64,${canvas.toString('base64')}`;
}