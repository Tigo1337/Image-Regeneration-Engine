import type { Express } from "express";
import { smartCropRequestSchema } from "@shared/schema";
import { detectObjectBoundingBox } from "../gemini";
import { requireActiveSubscription } from "../middleware/auth";
import sharp from "sharp";

export function registerCropRoutes(app: Express) {
  // Smart Crop Route
  app.post("/api/smart-crop", requireActiveSubscription, async (req, res) => {
    try {
      const { imageData, ...formData } = req.body;
      const { objectName, fillRatio, aspectRatio } = smartCropRequestSchema.parse(formData);

      if (!imageData) return res.status(400).json({ success: false, error: "No image data" });

      const box = await detectObjectBoundingBox(imageData, objectName);

      if (!box) {
          return res.status(404).json({ success: false, error: "Could not detect object specified" });
      }

      const [ymin, xmin, ymax, xmax] = box;

      const imgBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const metadata = await sharp(imgBuffer).metadata();
      const imgW = metadata.width!;
      const imgH = metadata.height!;

      const prodW = ((xmax - xmin) / 1000) * imgW;
      const prodH = ((ymax - ymin) / 1000) * imgH;
      const prodCenterX = ((xmin + xmax) / 2000) * imgW;
      const prodCenterY = ((ymin + ymax) / 2000) * imgH;

      let targetCropWidth = prodW / (fillRatio / 100);
      let targetCropHeight = targetCropWidth; 

      if (aspectRatio === "9:16") {
          targetCropHeight = targetCropWidth * (16/9);
      } else if (aspectRatio === "16:9") {
          targetCropHeight = targetCropWidth * (9/16);
      } else if (aspectRatio === "4:5") {
          targetCropHeight = targetCropWidth * (5/4);
      } else if (aspectRatio === "Original") {
          const imgRatio = imgH / imgW;
          targetCropHeight = targetCropWidth * imgRatio;
      }

      let scaleFactor = 1.0;
      if (targetCropWidth > imgW) scaleFactor = Math.min(scaleFactor, imgW / targetCropWidth);
      if (targetCropHeight > imgH) scaleFactor = Math.min(scaleFactor, imgH / targetCropHeight);

      const finalCropWidth = targetCropWidth * scaleFactor;
      const finalCropHeight = targetCropHeight * scaleFactor;

      let cropLeft = Math.round(prodCenterX - (finalCropWidth / 2));
      let cropTop = Math.round(prodCenterY - (finalCropHeight / 2));
      const cropWidthInt = Math.floor(finalCropWidth);
      const cropHeightInt = Math.floor(finalCropHeight);

      cropLeft = Math.max(0, Math.min(cropLeft, imgW - cropWidthInt));
      cropTop = Math.max(0, Math.min(cropTop, imgH - cropHeightInt));

      const srcLeft = Math.max(0, cropLeft);
      const srcTop = Math.max(0, cropTop);
      const srcRight = Math.min(imgW, cropLeft + cropWidthInt);
      const srcBottom = Math.min(imgH, cropTop + cropHeightInt);

      const srcWidth = srcRight - srcLeft;
      const srcHeight = srcBottom - srcTop;

      const extractedPiece = await sharp(imgBuffer)
        .extract({ left: srcLeft, top: srcTop, width: srcWidth, height: srcHeight })
        .toBuffer();

      const canvas = await sharp({
        create: {
          width: cropWidthInt,
          height: cropHeightInt,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0 } 
        }
      })
      .composite([{
        input: extractedPiece,
        top: srcTop - cropTop,
        left: srcLeft - cropLeft
      }])
      .png()
      .toBuffer();

      const finalBase64 = `data:image/png;base64,${canvas.toString("base64")}`;

      res.json({ success: true, generatedImage: finalBase64 });

    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to perform smart crop" });
    }
  });
}
