import type { Express } from "express";
import { createServer, type Server } from "http";
import { roomRedesignRequestSchema } from "@shared/schema";
import { generateRoomRedesign } from "./gemini";
import { processImageForGemini } from "./image-utils";
import { getImageAnalysisPrompt, buildGenerationPrompt } from "./prompt-templates";
import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

export async function registerRoutes(app: Express): Promise<Server> {

  app.post("/api/generate", async (req, res) => {
    try {
      const { imageData, prompt, ...formData } = req.body;

      // Validate the request
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

      // Process image to ensure it meets Gemini's requirements
      const processedImage = await processImageForGemini(imageData);

      // Generate the redesigned room using Gemini with the provided prompt
      const generatedImage = await generateRoomRedesign({
        imageBase64: processedImage,
        preservedElements: validatedData.preservedElements,
        targetStyle: validatedData.targetStyle,
        quality: validatedData.quality,
        aspectRatio: validatedData.aspectRatio,
        creativityLevel: validatedData.creativityLevel,
        customPrompt: prompt,
      });

      res.json({
        success: true,
        generatedImage,
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
