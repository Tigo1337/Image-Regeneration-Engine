import type { Express } from "express";
import { createServer, type Server } from "http";
import { roomRedesignRequestSchema } from "@shared/schema";
import { generateRoomRedesign, analyzeObjectStructure } from "./gemini"; 
import { processImageForGemini, cropImage, padImage, applyPerspectiveMockup } from "./image-utils";
import { storage } from "./storage";

function buildVariationPrompt(formData: any, variationType: "closeup" | "angle" | "far", originalPrompt: string): string {
  const element = formData.preservedElements || "the main furniture";
  const closeupTarget = formData.closeupFocus || "the detail"; 
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

  if (variationType !== "closeup") {
    prompt += `\n\nORIGINAL ROOM CONTEXT:
    The surrounding environment must match the specific design instructions provided by the user: "${originalPrompt}".
    Ensure all new flooring, walls, lighting, and decor match this theme perfectly.
    Do not invent a new room style; extend the existing one.`;
  }

  if (variationType === "closeup") {
    prompt += `\n\nINPUT: This is a LOW-RESOLUTION CROP focusing on "${closeupTarget}".
    The "${closeupTarget}" is ALREADY VISIBLE in the image.

    TASK: Super-Resolution Texture Refinement.
    1. Do NOT draw a new "${closeupTarget}". Do NOT overlay new geometry.
    2. Your ONLY job is to SHARPEN the existing pixels (Upscale).
    3. Enhance the definition of the materials (metal grain, reflections, textures) that are CURRENTLY THERE.
    4. Maintain the exact position, angle, and shape of the object in the input.`;
  } 
  else if (variationType === "angle") {
    prompt += `\n\nINPUT: This image is squashed and has a GRADIENT FADE into white space.

    TASK: Seamless Panoramic Extension (Stitching).

    CRITICAL "NO SPLIT" INSTRUCTIONS:
    1. IGNORE THE FADE LINE: The gradient fade on the edge is NOT a physical object. It is just the image fading out.
    2. SINGLE CONTINUOUS SPACE: You must continue the lines (floorboards, ceiling trim, wall texture) from the visible image STRAIGHT THROUGH the fade and into the white space.
    3. MERGE THE HALVES: There should be ZERO visible seam between the original pixels and your generated pixels.
    4. REJECT "TWO ROOMS": Do not draw a divider, column, or corner where the fade happens. The left side and right side are the EXACT SAME ROOM.`;
  } 
  else if (variationType === "far") {
    prompt += `\n\nINPUT: This image is centered with a white border (Zoomed Out).

    TASK: Outpainting / Field of View Expansion.

    CRITICAL INSTRUCTION - CONTINUITY:
    1. The center image is the "Anchor". The surrounding white space is the "Rest of the Room".
    2. You MUST extend the visual logic of the center image outwards.
    3. If the center has a specific floor pattern, the surroundings MUST have the same floor pattern.
    4. Do NOT create a "Room within a room". The walls of the center image should extend seamlessly to the edges of the canvas.`;
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

      // --- STEP 1: Generate Master Design ---

      const modifiedMainImage = await applyPerspectiveMockup(
        processedImage, 
        validatedData.viewAngle, 
        validatedData.cameraZoom
      );

      console.log(`Generating Master Design: ${validatedData.viewAngle}, Zoom: ${validatedData.cameraZoom}%`);

      let finalPrompt = prompt;

      const hasRefs = validatedData.referenceImages && validatedData.referenceImages.length > 0;
      const isAngleChange = validatedData.viewAngle !== "Original";

      // [UPDATED] 3D Analysis Logic (Optional/Non-Blocking)
      // We wrap this in try/catch. If the analysis model is unavailable, we skip it
      // and rely on the Direct Visual Reference injection below.
      if ((isAngleChange || hasRefs) && validatedData.preservedElements) {
        try {
          console.log("3D Analysis Attempted (Angle Change or Reference Images detected)...");

          const structureBrief = await analyzeObjectStructure(
            processedImage, 
            validatedData.referenceImages, 
            validatedData.preservedElements
          );

          if (structureBrief) {
              finalPrompt += `\n\nCRITICAL CONTEXT - 3D STRUCTURE ANALYSIS:
              Use the following technical analysis to ensure the "${validatedData.preservedElements}" is rendered correctly from the ${validatedData.viewAngle} view:
              ${structureBrief}`;
          }
        } catch (e) {
           console.warn("3D Structure Analysis skipped (Model unavailable or error). Proceeding with Visual References only.");
        }
      }

      // [UPDATED] Append specific instruction about the Visual References
      if (hasRefs) {
        finalPrompt += `\n\nIMPORTANT: I have provided ${validatedData.referenceImages!.length} additional reference images. These show the TRUE shape and details of the "${validatedData.preservedElements}". Prioritize these visual examples over any general knowledge about the object.`;
      }

      const mainImage = await generateRoomRedesign({
        imageBase64: modifiedMainImage, 
        referenceImages: validatedData.referenceImages, // [CRITICAL] Pass the visual references here
        preservedElements: validatedData.preservedElements,
        targetStyle: validatedData.targetStyle,
        quality: validatedData.quality,
        aspectRatio: validatedData.aspectRatio,
        creativityLevel: validatedData.creativityLevel, 
        customPrompt: finalPrompt, 
        outputFormat: validatedData.outputFormat,
      });

      let variations: string[] = [];

      // --- STEP 2: Generate Variations ---
      if (batchSize > 1) {
        console.log("Generating Variations...");

        const variationCreativity = {
          "closeup": 25, 
          "angle": 65,   
          "far": 65      
        };

        const variationConfigs = [
          { 
            type: "closeup" as const,
            preprocess: async (img: string) => await applyPerspectiveMockup(img, "Front (Original)", 200) 
          },
          { 
            type: "angle" as const,
            preprocess: async (img: string) => await applyPerspectiveMockup(img, "Side Angle (Right)", 100)
          },
          { 
            type: "far" as const,
            preprocess: async (img: string) => await applyPerspectiveMockup(img, "Front (Original)", 50) 
          }
        ];

        const variationsToRun = variationConfigs.slice(0, Math.min(batchSize - 1, 3));

        const variationPromises = variationsToRun.map(async (config) => {
          const modifiedImage = await config.preprocess(mainImage);
          const specificPrompt = buildVariationPrompt(validatedData, config.type, prompt);

          return generateRoomRedesign({
            imageBase64: modifiedImage,
            preservedElements: "", 
            targetStyle: validatedData.targetStyle,
            quality: validatedData.quality,
            aspectRatio: validatedData.aspectRatio,
            creativityLevel: variationCreativity[config.type], 
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
        creativityLevel: validatedData.creativityLevel,
        customPrompt: prompt,
        outputFormat: validatedData.outputFormat,
      });

      res.json({ success: true, generatedImage });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed" });
    }
  });

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