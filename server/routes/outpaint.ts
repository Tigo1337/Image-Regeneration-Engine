import type { Express } from "express";
import { z } from "zod";
import { generateRoomRedesign } from "../gemini";
import { prepareOutpaintCanvas } from "../image-utils";
import { requireActiveSubscription, reportGenerationUsage, getUserId } from "../middleware/auth";
import { uploadImageToStorage } from "../image-storage";
import { storage } from "../storage";

/**
 * Outpaint Routes
 * 
 * This module provides the /api/outpaint endpoint that extends an image
 * to a new aspect ratio by filling in the borders with AI-generated content.
 * The original image is centered on a grey canvas and the AI fills in the padding.
 */

const outpaintRequestSchema = z.object({
  imageData: z.string(),
  aspectRatio: z.string(), // "1:1", "16:9", etc.
  quality: z.string().default("High Fidelity (2K)"),
  outputFormat: z.string().default("PNG"),
});

export function registerOutpaintRoutes(app: Express) {
  app.post("/api/outpaint", requireActiveSubscription, async (req, res) => {
    try {
      const { imageData, aspectRatio, quality, outputFormat } = outpaintRequestSchema.parse(req.body);

      console.log(`[Outpaint] Extending image to ${aspectRatio}...`);

      // 1. Prepare the Canvas (Original centered + Grey Padding)
      const paddedImage = await prepareOutpaintCanvas(imageData, aspectRatio);

      // 2. Build the "Outpainting" Prompt
      const outpaintPrompt = `
=== ROLE: IMAGE EXTENDER ===
You are an expert photo editor specializing in "Outpainting" and "Uncropping".

=== INPUT ===
The provided image contains a central scene surrounded by GREY padding.

=== TASK ===
Fill the GREY padding to extend the room seamlessly. 

=== STRICT CONSTRAINTS ===
1. PRESERVE CENTER: The central part of the image (the original room) MUST REMAIN UNTOUCHED. Do not redesign the furniture or change the lighting of the existing center.
2. SEAMLESS EXTENSION: The new content must match the perspective, vanishing points, flooring textures, and wall colors of the center.
3. HALLUCINATE CONTEXT: If the ceiling is cut off, extend it naturally. If a window is cut off, complete it.
4. NO ARTIFACTS: Do not leave any grey borders.
`;

      // 3. Call Gemini
      // Creativity Level 2 allows it to invent the new surroundings naturally
      const generatedImage = await generateRoomRedesign({
        imageBase64: paddedImage,
        preservedElements: "the central original image",
        targetStyle: "Photorealistic",
        quality: quality,
        aspectRatio: aspectRatio, 
        creativityLevel: 2, 
        customPrompt: outpaintPrompt,
        outputFormat: outputFormat,
      });

      // 4. Save & Log
      const generatedImageUrl = await uploadImageToStorage(generatedImage, "generated");
      const originalImageUrl = await uploadImageToStorage(imageData, "originals");
      
      await storage.saveGeneratedDesign({
        userId: getUserId(req),
        timestamp: Date.now(),
        originalImageUrl,
        generatedImageUrl,
        originalFileName: "outpaint_extension",
        config: { 
          prompt: outpaintPrompt, 
          targetStyle: "Outpaint",
          aspectRatio 
        },
        variations: [],
      });

      // Log usage
      if (storage.createPromptLog) {
        await storage.createPromptLog({
          jobType: "outpaint",
          prompt: outpaintPrompt,
          parameters: { aspectRatio, mode: "Outpaint", quality }
        });
      }

      await reportGenerationUsage(req, quality);

      res.json({
        success: true,
        generatedImage,
        generatedImageUrl
      });

    } catch (error) {
      console.error("Error in /api/outpaint:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to outpaint image" 
      });
    }
  });
}
