import type { Express } from "express";
import { createServer, type Server } from "http";
import { roomRedesignRequestSchema } from "@shared/schema";
import { generateRoomRedesign, buildGenerationPrompt } from "./gemini";
import { processImageForGemini } from "./image-utils";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-prompt", async (req, res) => {
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
      const base64Data = processedImage.replace(/^data:image\/[a-z]+;base64,/, '');

      // Step 1: Analyze the original room image with Gemini Flash (vision)
      const analysisPrompt = `You are an expert interior designer. Analyze this room image in detail and describe:
1. The overall room type (bedroom, living room, kitchen, bathroom, etc.)
2. Current style and color palette
3. Key architectural features (windows, doors, ceiling height, built-in elements)
4. Furniture and decor items present
5. Lighting and atmosphere
6. The specific elements the user wants to preserve: ${validatedData.preservedElements}

Provide a comprehensive description focusing on spatial layout, materials, textures, and the exact location and appearance of preserved elements.`;

      const analysisResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: analysisPrompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ],
      });

      const roomAnalysis = analysisResponse.text || "A well-lit interior room";
      const generationPrompt = await buildGenerationPrompt(roomAnalysis, validatedData);

      res.json({
        success: true,
        prompt: generationPrompt,
      });
    } catch (error) {
      console.error("Error in /api/generate-prompt:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate prompt"
      });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
