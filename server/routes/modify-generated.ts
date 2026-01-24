import type { Express } from "express";
import { modifyGeneratedRequestSchema } from "@shared/schema";
import { generateRoomRedesign } from "../gemini";
import { processImageForGemini } from "../image-utils";
import { storage } from "../storage";
import { uploadImageToStorage } from "../image-storage";
import { getUserId, requireActiveSubscription, reportGenerationUsage } from "../middleware/auth";
import { buildModificationPrompt } from "../lib/prompt-utils";

export function registerModifyGeneratedRoutes(app: Express) {
  // Modify Generated Image - Dedicated endpoint with logging
  app.post("/api/modify-generated", requireActiveSubscription, async (req, res) => {
    try {
      // Validate request body using zod schema
      const validatedData = modifyGeneratedRequestSchema.parse(req.body);
      
      const { 
        sourceGeneratedImage,
        originalImage, // Available for future reference/comparison features
        modificationRequest,
        currentStyle,
        preservedElements,
        quality,
        creativityLevel,
      } = validatedData;

      console.log(`[modify-generated] Processing modification request: "${modificationRequest.substring(0, 50)}..."`);

      // Process the source generated image
      const processedSourceImage = await processImageForGemini(sourceGeneratedImage);

      // Build controlled modification prompt
      const modificationPrompt = buildModificationPrompt({
        modificationRequest: modificationRequest.trim(),
        currentStyle: currentStyle,
        preservedElements: preservedElements,
        creativityLevel: creativityLevel,
      });

      console.log(`[modify-generated] Built prompt (${modificationPrompt.length} chars)`);

      // Call Gemini API to generate modified image
      const modifiedImage = await generateRoomRedesign({
        imageBase64: processedSourceImage,
        preservedElements: preservedElements,
        targetStyle: currentStyle,
        quality: quality,
        aspectRatio: "Original",
        creativityLevel: creativityLevel,
        customPrompt: modificationPrompt,
        outputFormat: "PNG",
      });

      // Upload modified image to storage
      const modifiedImageUrl = await uploadImageToStorage(modifiedImage, "generated");

      // LOG to prompt_logs with dedicated job type
      if (storage.createPromptLog) {
        await storage.createPromptLog({
          jobType: "modify-generated",
          prompt: modificationPrompt,
          parameters: {
            modificationRequest: modificationRequest.trim(),
            currentStyle: currentStyle,
            preservedElements: preservedElements,
            creativityLevel: creativityLevel,
            quality: quality,
            userId: getUserId(req),
          }
        });
        console.log(`[modify-generated] Logged to prompt_logs (job_type: modify-generated)`);
      }

      // Report usage to Stripe (skipped for super admins)
      await reportGenerationUsage(req, quality);

      res.json({
        success: true,
        generatedImage: modifiedImage,
        modifiedImageUrl,
        appliedPrompt: modificationPrompt,
      });

    } catch (error) {
      console.error("Error in /api/modify-generated:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to modify generated image"
      });
    }
  });
}
