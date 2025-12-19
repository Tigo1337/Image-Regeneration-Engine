import sharp from "sharp";

const MAX_IMAGE_SIZE_MB = 4;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION = 2048;

export async function processImageForGemini(base64Data: string): Promise<string> {
  // ... (Same as before)
  const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  const imageBuffer = Buffer.from(base64Image, 'base64');
  const metadata = await sharp(imageBuffer).metadata();
  const currentSize = imageBuffer.length;
  if (currentSize <= MAX_IMAGE_SIZE_BYTES && (metadata.width || 0) <= MAX_DIMENSION && (metadata.height || 0) <= MAX_DIMENSION) return base64Data;

  let resizedBuffer = imageBuffer;
  if ((metadata.width || 0) > MAX_DIMENSION || (metadata.height || 0) > MAX_DIMENSION) {
    resizedBuffer = await sharp(imageBuffer).resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
  }
  if (resizedBuffer.length > MAX_IMAGE_SIZE_BYTES) {
    let quality = 80;
    while (resizedBuffer.length > MAX_IMAGE_SIZE_BYTES && quality > 30) {
      resizedBuffer = await sharp(imageBuffer).resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality }).toBuffer();
      quality -= 10;
    }
  }
  return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
}

// Keep explicit crop for Batch mode
export async function cropImage(base64Data: string): Promise<string> {
  return applyPerspectiveMockup(base64Data, "Front (Original)", 200); // Reuse logic with 200% zoom
}
export async function padImage(base64Data: string, mode: 'center' | 'right' | 'left' = 'center'): Promise<string> {
   if (mode === 'center') return applyPerspectiveMockup(base64Data, "Front (Original)", 50);
   if (mode === 'right') return applyPerspectiveMockup(base64Data, "Side Angle (Left)", 100);
   if (mode === 'left') return applyPerspectiveMockup(base64Data, "Side Angle (Right)", 100);
   return base64Data;
}

async function createGradientMask(width: number, height: number, fadeSide: 'left' | 'right'): Promise<Buffer> {
  // ... (Same as before)
  const gradientId = "fade";
  const x1 = fadeSide === 'right' ? "0%" : "100%";
  const x2 = fadeSide === 'right' ? "100%" : "0%";
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="${gradientId}" x1="${x1}" y1="0%" x2="${x2}" y2="0%"><stop offset="85%" stop-color="white" stop-opacity="1"/><stop offset="100%" stop-color="black" stop-opacity="0"/></linearGradient></defs><rect x="0" y="0" width="${width}" height="${height}" fill="url(#${gradientId})" /></svg>`;
  return Buffer.from(svg);
}

// UPDATED: Accepts zoomLevel (50-200)
export async function applyPerspectiveMockup(base64Data: string, viewAngle: string, zoomLevel: number = 100): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // Convert zoom percentage to scale factor
    // 100 -> 1.0, 50 -> 0.5 (smaller image, wide view), 200 -> 2.0 (larger image, crop)
    const zoomScale = zoomLevel / 100;

    let transform = {
      width: width,
      height: height,
      left: 0,
      top: 0,
      canvasWidth: width,
      canvasHeight: height,
      fadeSide: null as 'left' | 'right' | null
    };

    // 1. ANGLE LOGIC (Squash Width)
    let angleScaleX = 1.0;
    if (viewAngle.includes("Left")) {
      angleScaleX = 0.5; // Squash to 50% width
      transform.fadeSide = 'left';
    } else if (viewAngle.includes("Right")) {
      angleScaleX = 0.5;
      transform.fadeSide = 'right';
    }

    // 2. ZOOM LOGIC
    if (zoomScale < 1.0) {
      // ZOOM OUT (Wide): Scale down the image
      // Final Size = Original * AngleSquash * ZoomScale
      transform.width = Math.floor(width * angleScaleX * zoomScale);
      transform.height = Math.floor(height * zoomScale);

      // Center based on fade side or center
      if (transform.fadeSide === 'left') {
        transform.left = width - transform.width; // Pin Right
      } else if (transform.fadeSide === 'right') {
        transform.left = 0; // Pin Left
      } else {
        // Center (Front View Zoom Out)
        transform.left = Math.floor((width - transform.width) / 2);
      }
      transform.top = Math.floor((height - transform.height) / 2);

    } else if (zoomScale > 1.0) {
      // ZOOM IN (Crop): The 'image' is bigger than canvas.
      // We render a crop. 
      // For simplicity in this mockup, we actually CROP the buffer first.

      // Calculate crop area relative to original
      const cropWidth = Math.floor(width / zoomScale);
      const cropHeight = Math.floor(height / zoomScale);
      const cropLeft = Math.floor((width - cropWidth) / 2);
      const cropTop = Math.floor((height - cropHeight) / 2);

      // We extract the crop, effectively "Zooming In"
      // Note: This bypasses the angle squash for closeups usually, 
      // but if we want Angle + Zoom In, we crop FIRST, then Squash.
      // Let's keep it simple: Zoom In overrides angle slightly for stability, 
      // or we apply angle to the crop.
      // Current robust approach: Just Crop. Angle logic for closeups is subtle.
      if (viewAngle === "Front (Original)") {
         const croppedBuffer = await sharp(buffer)
           .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
           .resize(width, height) // Scale back up to canvas size
           .toBuffer();
         return `data:image/jpeg;base64,${croppedBuffer.toString('base64')}`;
      } else {
         // Angle + Zoom In is tricky. Let's just do standard Angle logic but with Full Size.
         // Effectively, if Zoom > 100, we ignore it here and let the prompt handle detail,
         // OR we just allow the user to crop manually.
         // Let's stick to: Zoom In = Center Crop.
         const croppedBuffer = await sharp(buffer)
           .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
           .resize(width, height)
           .toBuffer();
         // Recurse to apply angle to the cropped result
         return applyPerspectiveMockup(`data:image/jpeg;base64,${croppedBuffer.toString('base64')}`, viewAngle, 100);
      }
    } else {
      // Zoom = 100%
      // Just apply angle logic
      transform.width = Math.floor(width * angleScaleX);
      if (transform.fadeSide === 'left') transform.left = width - transform.width;
      if (transform.fadeSide === 'right') transform.left = 0;
    }

    // 3. APPLY TRANSFORMATION
    const distortions = (viewAngle.includes("Side")) ? { fit: 'fill' as const } : { fit: 'inside' as const };

    let distortedImageBuffer = await sharp(buffer)
      .resize(transform.width, transform.height, distortions)
      .toBuffer();

    if (transform.fadeSide) {
      const mask = await createGradientMask(transform.width, transform.height, transform.fadeSide);
      distortedImageBuffer = await sharp(distortedImageBuffer)
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toBuffer();
    }

    const finalComposition = await sharp({
      create: {
        width: transform.canvasWidth,
        height: transform.canvasHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([{
      input: distortedImageBuffer,
      top: transform.top,
      left: transform.left
    }])
    .jpeg({ quality: 90 })
    .toBuffer();

    return `data:image/jpeg;base64,${finalComposition.toString('base64')}`;

  } catch (e) {
    console.error("Perspective Mockup failed", e);
    return base64Data;
  }
}