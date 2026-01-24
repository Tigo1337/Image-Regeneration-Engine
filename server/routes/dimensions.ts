import type { Express } from "express";
import { dimensionalImageRequestSchema } from "@shared/schema";
import { generateRoomRedesign } from "../gemini";
import { processImageForGemini } from "../image-utils";
import { requireActiveSubscription, reportGenerationUsage } from "../middleware/auth";
import { constructDimensionalPrompt } from "../dimensional-prompt";

export function registerDimensionRoutes(app: Express) {
  // Dimensional Image Generation
  app.post("/api/generate-dimensional", requireActiveSubscription, async (req, res) => {
    try {
      const { imageData, ...formData } = req.body;
      const validatedData = dimensionalImageRequestSchema.parse(formData);

      if (!imageData) {
        return res.status(400).json({ success: false, error: "No image data provided" });
      }

      const processedImage = await processImageForGemini(imageData);
      const dimensionalPrompt = constructDimensionalPrompt(validatedData);

      const generatedImage = await generateRoomRedesign({
        imageBase64: processedImage,
        preservedElements: "the entire product",
        targetStyle: "Technical Documentation",
        quality: "High Fidelity (2K)",
        aspectRatio: "1:1",
        creativityLevel: 2,
        customPrompt: dimensionalPrompt,
        outputFormat: "PNG",
      });

      // Report usage to Stripe (skipped for super admins)
      await reportGenerationUsage(req, "High Fidelity (2K)");

      res.json({
        success: true,
        generatedImage,
        prompt: dimensionalPrompt,
      });

    } catch (error) {
      console.error("Error in /api/generate-dimensional:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate dimensional image",
      });
    }
  });
}
