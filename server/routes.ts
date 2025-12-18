import type { Express } from "express";
import { createServer, type Server } from "http";
import { roomRedesignRequestSchema } from "@shared/schema";
import { generateRoomRedesign } from "./gemini";
import { processImageForGemini } from "./image-utils";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {

  app.post("/api/generate", async (req, res) => {
    try {
      // Extract batchSize, default to 1 if not present
      const { imageData, prompt, batchSize = 1, ...formData } = req.body;

      // Validate the request data against the schema
      const validatedData = roomRedesignRequestSchema.parse(formData);

      if (!imageData) {
        return res.status(400).json({ 
          success: false, 
          error: "No image data provided" 
        });
      }

      if (!prompt) {
        return res.status(400).json({ 
          success: false, 
          error: "No prompt provided" 
        });
      }

      // Process image (resize/convert) to meet Gemini requirements
      const processedImage = await processImageForGemini(imageData);

      // Step 4: Handle Batch Variations
      // We run parallel requests if batchSize > 1 to generate multiple options
      // Limit to 4 max to prevent timeouts or rate limits
      const count = Math.min(Math.max(1, batchSize), 4);

      const generationPromises = Array(count).fill(null).map(() => 
        generateRoomRedesign({
          imageBase64: processedImage,
          preservedElements: validatedData.preservedElements,
          targetStyle: validatedData.targetStyle,
          quality: validatedData.quality,
          aspectRatio: validatedData.aspectRatio,
          creativityLevel: validatedData.creativityLevel,
          customPrompt: prompt,
          // FIX: Pass the output format to the generator
          outputFormat: validatedData.outputFormat,
        })
      );

      // Wait for all generations to complete
      const results = await Promise.all(generationPromises);

      // The first image is the main result, others are variations
      const generatedImage = results[0];
      const variations = results.slice(1);

      res.json({
        success: true,
        generatedImage,
        variations, // Return the variations to the client
      });

    } catch (error) {
      console.error("Error in /api/generate:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate room redesign"
      });
    }
  });

  app.post("/api/modify", async (req, res) => {
    try {
      const { imageData, referenceImage, prompt, ...formData } = req.body;

      // Validate the request
      const validatedData = roomRedesignRequestSchema.parse(formData);

      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: "No image data provided"
        });
      }

      if (!referenceImage) {
        return res.status(400).json({
          success: false,
          error: "No reference image provided"
        });
      }

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: "No modification prompt provided"
        });
      }

      // Process the reference (previously generated) image
      const processedReference = await processImageForGemini(referenceImage);

      // Generate modified image using the reference image
      const generatedImage = await generateRoomRedesign({
        imageBase64: processedReference,
        preservedElements: validatedData.preservedElements,
        targetStyle: validatedData.targetStyle,
        quality: validatedData.quality,
        aspectRatio: validatedData.aspectRatio,
        creativityLevel: validatedData.creativityLevel,
        customPrompt: prompt,
        // FIX: Pass the output format here as well
        outputFormat: validatedData.outputFormat,
      });

      res.json({
        success: true,
        generatedImage,
      });
    } catch (error) {
      console.error("Error in /api/modify:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to apply modification"
      });
    }
  });

  app.post("/api/gallery/save", async (req, res) => {
    try {
      const { originalImage, generatedImage, originalFileName, config } = req.body;

      if (!originalImage || !generatedImage || !originalFileName || !config) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields"
        });
      }

      // Save to persistent storage
      const design = await storage.saveGeneratedDesign({
        timestamp: Date.now(),
        originalImage,
        generatedImage,
        originalFileName,
        config,
      });

      res.json({
        success: true,
        design,
      });
    } catch (error) {
      console.error("Error in /api/gallery/save:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to save design"
      });
    }
  });

  app.get("/api/gallery", async (req, res) => {
    try {
      const designs = await storage.getGeneratedDesigns();
      res.json(designs);
    } catch (error) {
      console.error("Error in /api/gallery:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch designs"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}