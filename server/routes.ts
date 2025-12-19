import type { Express } from "express";
import { createServer, type Server } from "http";
import { roomRedesignRequestSchema } from "@shared/schema";
import { generateRoomRedesign } from "./gemini";
import { processImageForGemini, cropImage, padImage } from "./image-utils";
import { storage } from "./storage";

// Helper to build specific prompts that reinforce OBJECT IDENTITY
function buildVariationPrompt(formData: any, variationType: "closeup" | "angle" | "far"): string {
  const element = formData.preservedElements || "the main furniture";
  const closeupTarget = formData.closeupFocus || element; 
  const style = formData.targetStyle; 

  let prompt = `ROLE: Expert Architectural Photographer & Retoucher.

  CORE TASK:
  You are provided with a partial or manipulated image of a "${element}".
  Your goal is to complete/refine this image into a photorealistic architectural shot.

  CRITICAL IDENTITY RULE:
  The "${element}" must look EXACTLY the same as it does in the input pixels.
  Do NOT redesign it. Do NOT change the handle, finish, or material. 
  This is the same physical object, just viewed differently.

  STYLE: ${style}.`;

  if (variationType === "closeup") {
    prompt += `\n\nINPUT: This is a CROPPED center view.
    TASK: Macro Close-up of: "${closeupTarget}".
    Upscale and refine the textures of this specific area.
    Show the hardware (handles/hinges) and material finish in extreme detail.
    Keep the geometry 100% identical to the input.`;
  } 
  else if (variationType === "angle") {
    prompt += `\n\nINPUT: This image is padded on the RIGHT side.
    TASK: Outpaint the empty white space on the right to create a SIDE-ANGLE view.

    LAYOUT CONSISTENCY RULE:
    You must NOT invent a new room layout. 
    Extrapolate the EXISTING floor pattern, wall lines, and ceiling height from the left side seamlessly into the right side.
    If there is a wall on the left, continue it logically. 
    Do not place random windows or doors that contradict the architectural logic of the visible part.`;
  } 
  else if (variationType === "far") {
    prompt += `\n\nINPUT: This image has a white border (Zoomed Out).
    TASK: Outpaint the surrounding environment (Floor, Ceiling, Walls).
    Extend the existing room design seamlessly into the white border.
    The center object is the anchor—do not touch it. Just build the room around it.`;
  }

  return prompt;
}

export async function registerRoutes(app: Express): Promise<Server> {

  app.post("/api/generate", async (req, res) => {
    try {
      const { imageData, prompt, batchSize = 1, ...formData } = req.body;
      const validatedData = roomRedesignRequestSchema.parse(formData);

      if (!imageData) return res.status(400).json({ success: false, error: "No image data" });
      if (!prompt) return res.status(400).json({ success: false, error: "No prompt" });

      const processedImage = await processImageForGemini(imageData);

      // --- STEP 1: Generate Master Design (Front View) ---
      console.log("Generating Master Design (Front View)...");
      const mainImage = await generateRoomRedesign({
        imageBase64: processedImage,
        preservedElements: validatedData.preservedElements,
        targetStyle: validatedData.targetStyle,
        quality: validatedData.quality,
        aspectRatio: validatedData.aspectRatio,
        // [IMPORTANT] Pass the user's creativity level here
        creativityLevel: validatedData.creativityLevel, 
        customPrompt: prompt,
        outputFormat: validatedData.outputFormat,
      });

      let variations: string[] = [];

      // --- STEP 2: Generate Variations (Geometric Forcing) ---
      if (batchSize > 1) {
        console.log("Generating Variations with Geometric Forcing...");

        const variationConfigs = [
          { 
            type: "closeup" as const,
            preprocess: async (img: string) => await cropImage(img)
          },
          { 
            type: "angle" as const,
            preprocess: async (img: string) => await padImage(img, 'right')
          },
          { 
            type: "far" as const,
            preprocess: async (img: string) => await padImage(img, 'center')
          }
        ];

        const variationsToRun = variationConfigs.slice(0, Math.min(batchSize - 1, 3));

        const variationPromises = variationsToRun.map(async (config) => {
          const modifiedImage = await config.preprocess(mainImage);
          const specificPrompt = buildVariationPrompt(validatedData, config.type);

          return generateRoomRedesign({
            imageBase64: modifiedImage,
            preservedElements: "", 
            targetStyle: validatedData.targetStyle,
            quality: validatedData.quality,
            aspectRatio: validatedData.aspectRatio,
            // [IMPORTANT] For variations (rotations/zooms), we keep creativity lower (35)
            // to ensure the object identity doesn't morph too much.
            creativityLevel: 35, 
            customPrompt: specificPrompt,
            outputFormat: validatedData.outputFormat,
          });
        });

        variations = await Promise.all(variationPromises);
      }

      res.json({
        success: true,
        generatedImage: mainImage,
        variations: variations, 
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
      const validatedData = roomRedesignRequestSchema.parse(formData);
      if (!imageData || !referenceImage || !prompt) return res.status(400).json({ success: false, error: "Missing fields" });

      const processedReference = await processImageForGemini(referenceImage);
      const generatedImage = await generateRoomRedesign({
        imageBase64: processedReference,
        preservedElements: validatedData.preservedElements,
        targetStyle: validatedData.targetStyle,
        quality: validatedData.quality,
        aspectRatio: validatedData.aspectRatio,
        // Pass creativity level for modifications too
        creativityLevel: validatedData.creativityLevel,
        customPrompt: prompt,
        outputFormat: validatedData.outputFormat,
      });

      res.json({ success: true, generatedImage });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed" });
    }
  });

  // ... (Keep existing gallery routes) ...
  app.post("/api/gallery/save", async (req, res) => {
    try {
      const { originalImage, generatedImage, originalFileName, config } = req.body;
      const design = await storage.saveGeneratedDesign({
        timestamp: Date.now(),
        originalImage,
        generatedImage,
        originalFileName,
        config,
      });
      res.json({ success: true, design });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to save" });
    }
  });

  app.get("/api/gallery", async (req, res) => {
    try {
      const designs = await storage.getGeneratedDesigns();
      res.json(designs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}