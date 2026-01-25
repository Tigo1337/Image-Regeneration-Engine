import type { Express } from "express";
import { z } from "zod";
import { roomRedesignRequestSchema } from "@shared/schema";
import { generateRoomRedesign } from "../gemini";
import { processImageForGemini } from "../image-utils";
import { storage } from "../storage";
import { uploadImageToStorage } from "../image-storage";
import { getUserId, requireActiveSubscription, reportGenerationUsage } from "../middleware/auth";

/**
 * Modify Routes - Specific Element Update & Legacy Modify
 * 
 * This module contains:
 * 1. /api/modify/element - New Specific Element Update feature for precise hardware/fixture changes
 * 2. /api/modify - Legacy route for backwards compatibility
 * 
 * The Element Update feature uses a strict preservation prompt with low creativity
 * to ensure only the specified element (e.g., cabinet handles, faucets, light fixtures)
 * is modified while the rest of the room remains pixel-perfect.
 */

// Schema for the Element Update specific function
const elementUpdateRequestSchema = z.object({
  imageData: z.string().min(1, "Image data is required"),
  modificationRequest: z.string().min(1, "Modification request is required"),
  originalFileName: z.string().optional(),
});

export function registerModifyRoutes(app: Express) {
  
  // Specific Element Update Endpoint (New Feature)
  app.post("/api/modify/element", requireActiveSubscription, async (req, res) => {
    try {
      const { imageData, modificationRequest, originalFileName } = elementUpdateRequestSchema.parse(req.body);

      if (!imageData) {
        return res.status(400).json({ success: false, error: "No image data provided" });
      }

      console.log(`[Modify Element] Request: "${modificationRequest}"`);

      // Process Image
      const processedImage = await processImageForGemini(imageData);

      // Construct STRICT Preservation Prompt
      // We do not use the standard prompt builder here because we need extreme constraints.
      const strictPrompt = `
=== ROLE: EXPERT PHOTO RETOUCHER ===
You are an expert architectural visualizer and photo editor. 
Your task is to edit the provided image with PIXEL-PERFECT precision.

=== INSTRUCTION ===
${modificationRequest}

=== STRICT CONSTRAINTS (DO NOT IGNORE) ===
1. NO REDESIGN: Do NOT change the style, flooring, walls, lighting, or furniture arrangement.
2. TARGET ONLY: Modify ONLY the specific element mentioned in the instruction (e.g., hardware, faucet, cabinet color).
3. PRESERVE GEOMETRY: Keep the exact perspective and geometry of the original room.
4. TEXTURE MATCHING: Ensure the new element's lighting and shadows match the existing scene perfectly.
5. OUTPUT: A photorealistic, high-resolution image of the SAME room with ONLY the requested change.
`;

      // Call AI with Low Creativity (level 1) to force adherence to the original image
      const generatedImage = await generateRoomRedesign({
        imageBase64: processedImage,
        preservedElements: "the entire room except the requested change", 
        targetStyle: "Photorealistic", 
        quality: "High Fidelity (2K)",
        aspectRatio: "Original",
        creativityLevel: 1, // FORCE LOW CREATIVITY for precision
        customPrompt: strictPrompt,
        outputFormat: "PNG",
      });

      // Save to storage
      const generatedImageUrl = await uploadImageToStorage(generatedImage, "generated");
      const originalImageUrl = await uploadImageToStorage(imageData, "originals");
      
      // Save to gallery
      await storage.saveGeneratedDesign({
        userId: getUserId(req),
        timestamp: Date.now(),
        originalImageUrl,
        generatedImageUrl,
        originalFileName: originalFileName ? `mod_${originalFileName}` : "modified_element",
        config: { 
          prompt: strictPrompt, 
          targetStyle: "Element Update",
          modificationRequest 
        },
        variations: [],
      });

      // Log to prompt_logs
      if (storage.createPromptLog) {
        await storage.createPromptLog({
          jobType: "element-update",
          prompt: strictPrompt,
          parameters: {
            modificationRequest,
            mode: "Strict Element Update",
            userId: getUserId(req),
          }
        });
      }

      // Report usage to Stripe
      await reportGenerationUsage(req, "High Fidelity (2K)");

      res.json({
        success: true,
        generatedImage,
        generatedImageUrl
      });

    } catch (error) {
      console.error("Error in /api/modify/element:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to modify element"
      });
    }
  });

  // Legacy Modify Route (Backwards Compatibility)
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
