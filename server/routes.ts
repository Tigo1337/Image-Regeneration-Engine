import type { Express } from "express";
import { createServer, type Server } from "http";
import { roomRedesignRequestSchema } from "@shared/schema";
import { generateRoomRedesign } from "./gemini";
import { processImageForGemini } from "./image-utils";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate", async (req, res) => {
    try {
      const { imageData, ...formData } = req.body;

      // Validate the request
      const validatedData = roomRedesignRequestSchema.parse(formData);

      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: "No image data provided"
        });
      }

      // Process image to ensure it meets Gemini's requirements
      const processedImage = await processImageForGemini(imageData);

      // Generate the redesigned room using Gemini
      const generatedImage = await generateRoomRedesign({
        imageBase64: processedImage,
        preservedElements: validatedData.preservedElements,
        targetStyle: validatedData.targetStyle,
        quality: validatedData.quality,
        creativityLevel: validatedData.creativityLevel,
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

  const httpServer = createServer(app);
  return httpServer;
}
