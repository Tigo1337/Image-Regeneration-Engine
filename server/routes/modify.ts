import type { Express } from "express";
import { roomRedesignRequestSchema } from "@shared/schema";
import { generateRoomRedesign } from "../gemini";
import { processImageForGemini } from "../image-utils";

/**
 * Legacy Modify Route - Foundation for "Specific Element Update" Feature
 * 
 * This module will serve as the base for the upcoming hardware replacement feature,
 * allowing users to specify and replace specific elements (e.g., cabinet handles,
 * light fixtures, faucets) while preserving the rest of the design.
 * 
 * Imports generateRoomRedesign and processImageForGemini for direct access
 * when implementing element-specific modifications.
 */
export function registerModifyRoutes(app: Express) {
  // Legacy Modify Route
  app.post("/api/modify", async (req, res) => {
    try {
      const { imageData, referenceImage, prompt, ...formData } = req.body;
      const validatedData = roomRedesignRequestSchema.parse(formData);
      
      if (!imageData || !referenceImage || !prompt) {
        return res.status(400).json({ success: false, error: "Missing required fields: imageData, referenceImage, or prompt" });
      }

      const processedReference = await processImageForGemini(referenceImage);
      
      const generatedImage = await generateRoomRedesign({
        imageBase64: processedReference,
        preservedElements: validatedData.preservedElements,
        targetStyle: validatedData.targetStyle,
        quality: validatedData.quality,
        aspectRatio: validatedData.aspectRatio,
        creativityLevel: validatedData.creativityLevel,
        customPrompt: prompt,
        outputFormat: validatedData.outputFormat,
      });

      res.json({ success: true, generatedImage });
      
    } catch (error) {
      console.error("Error in /api/modify:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to modify image" 
      });
    }
  });
}
