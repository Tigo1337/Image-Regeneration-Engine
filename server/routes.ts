import type { Express } from "express";
import { createServer, type Server } from "http";
import { roomRedesignRequestSchema } from "@shared/schema";
import { generateRoomRedesign, analyzeObjectStructure } from "./gemini"; 
import { processImageForGemini, cropImage, padImage, applyPerspectiveMockup } from "./image-utils";
import { storage } from "./storage";
import { uploadImageToStorage } from "./image-storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";

// [UPDATED] Prompt Builder with Close-up rule for Top View
function buildVariationPrompt(formData: any, variationType: string, structureAnalysis: string = ""): string {
  const style = formData.targetStyle || "the existing style";

  let prompt = `ROLE: Expert Architectural Visualizer.

  TASK: Generate a new view of the room shown in the input image.
  TARGET VIEW: ${variationType.toUpperCase()}.

  STRICT PRESERVATION RULES:
  1. The Input Image is the primary reference for the object's silhouette.
  2. You must NOT change the furniture, decor, lighting, or materials.
  3. Keep the "${style}" aesthetic exactly as shown.

  CRITICAL - HANDLING HIDDEN ANGLES:
  The Input Image only shows the Front. You MUST use the provided "Visual Reference Images" and the "3D Structure Analysis" below to reconstruct the hidden sides.
  `;

  if (structureAnalysis) {
    prompt += `\n\n=== 3D STRUCTURE ANALYSIS (GROUND TRUTH) ===
    Use this technical description to render the details correctly:
    ${structureAnalysis}
    ============================================\n`;
  }

  if (variationType === "Front") {
    prompt += `\n\nINSTRUCTION: FRONT ELEVATION.
    - Move the camera to be directly in front of the main area/furniture.
    - Flatten the perspective (Orthographic-like or 2-point perspective).
    - Ensure vertical lines are perfectly straight.`;
  } 
  else if (variationType === "Side") {
    prompt += `\n\nINSTRUCTION: ANGLE VIEW (45-Degree).
    - Move the camera 45 degrees to the side.
    - CRITICAL: TEXTURE CLONING. Look at the Reference Images. If the side panel has a specific pattern (e.g., fluting, beadboard, slats, or marble grain), you MUST copy that EXACT pattern.
    - DO NOT APPROXIMATE. If the reference shows vertical slats, render vertical slats.
    - Do NOT add a corner to the wall. Keep the back wall FLAT.`;
  } 
  else if (variationType === "Top") {
    prompt += `\n\nINSTRUCTION: CLOSE-UP ARCHITECTURAL FLOOR PLAN CUTAWAY.
    - Move the camera vertically above the center of the room looking straight down (90-degree angle).
    - ZOOM LEVEL: Close-up. Fill the frame with the main furniture/object.
    - FILL THE ENTIRE CANVAS. No white borders, no padding.
    - CUTAWAY MODE: REMOVE THE CEILING. Do not render the ceiling, roof, or high-hanging lights that block the view.
    - The view must look like a "Section Cut" looking down into the room.
    - CRITICAL: NO PERSPECTIVE DISTORTION on the walls. Walls should look like thin lines or be invisible borders.
    - Preserve all floor decor (rugs, mats) exactly as they are.`;
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
      const hasDrawing = !!validatedData.referenceDrawing;
      const isAngleChange = validatedData.viewAngle !== "Original";

      if ((isAngleChange || hasRefs) && validatedData.preservedElements) {
        try {
          console.log("3D Analysis Attempted...");
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
           console.warn("3D Structure Analysis skipped (Model unavailable or error).");
        }
      }

      if (hasRefs) {
        finalPrompt += `\n\nIMPORTANT: I have provided ${validatedData.referenceImages!.length} additional reference images. These show the TRUE shape and details of the "${validatedData.preservedElements}". Prioritize these visual examples.`;
      }

      if (hasDrawing) {
        finalPrompt += `\n\nCRITICAL: A Technical Drawing (PDF/Image) has been provided. You MUST strictly adhere to the dimensions, orthographic views, and geometry shown in this drawing. It is the "Ground Truth".`;
      }

      const mainImage = await generateRoomRedesign({
        imageBase64: modifiedMainImage, 
        referenceImages: validatedData.referenceImages,
        referenceDrawing: validatedData.referenceDrawing,
        preservedElements: validatedData.preservedElements,
        targetStyle: validatedData.targetStyle,
        quality: validatedData.quality,
        aspectRatio: validatedData.aspectRatio,
        creativityLevel: validatedData.creativityLevel, 
        customPrompt: finalPrompt, 
        outputFormat: validatedData.outputFormat,
      });

      res.json({
        success: true,
        generatedImage: mainImage,
        variations: [],
      });

    } catch (error) {
      console.error("Error in /api/generate:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate room redesign"
      });
    }
  });

  app.post("/api/variations", async (req, res) => {
    try {
      const { imageData, prompt, selectedVariations, ...formData } = req.body;
      const validatedData = roomRedesignRequestSchema.parse(formData);

      if (!imageData) return res.status(400).json({ success: false, error: "No source image provided" });

      console.log("Generating Additional Perspectives...");
      console.log("Requested views:", selectedVariations);

      // Run 3D Analysis for Variations if references exist
      let structureAnalysis = "";
      if (validatedData.referenceImages && validatedData.referenceImages.length > 0 && validatedData.preservedElements) {
        try {
            console.log("Running 3D Structure Analysis for Variations...");
            structureAnalysis = await analyzeObjectStructure(
              imageData, 
              validatedData.referenceImages, 
              validatedData.preservedElements
            );
        } catch (e) {
            console.warn("Variation Analysis skipped:", e);
        }
      }

      // [UPDATED] Set Top View zoom to 135
      const variationConfigs = [
        { 
          type: "Front",
          preprocess: async (img: string) => await applyPerspectiveMockup(img, "Front", 100) 
        },
        { 
          type: "Side",
          preprocess: async (img: string) => await applyPerspectiveMockup(img, "Side", 100)
        },
        { 
          type: "Top",
          preprocess: async (img: string) => await applyPerspectiveMockup(img, "Top", 135) 
        }
      ];

      const variationsToRun = selectedVariations && Array.isArray(selectedVariations)
        ? variationConfigs.filter(cfg => selectedVariations.includes(cfg.type))
        : variationConfigs;

      if (variationsToRun.length === 0) {
         return res.json({ success: true, variations: [] });
      }

      const variationPromises = variationsToRun.map(async (config) => {
        const modifiedImage = await config.preprocess(imageData);
        const specificPrompt = buildVariationPrompt(validatedData, config.type, structureAnalysis);

        return generateRoomRedesign({
          imageBase64: modifiedImage,
          referenceImages: validatedData.referenceImages, 
          referenceDrawing: validatedData.referenceDrawing,
          preservedElements: validatedData.preservedElements, 
          targetStyle: validatedData.targetStyle,
          quality: validatedData.quality,
          aspectRatio: validatedData.aspectRatio,
          creativityLevel: 35, 
          customPrompt: specificPrompt,
          outputFormat: validatedData.outputFormat,
        });
      });

      const variations = await Promise.all(variationPromises);

      res.json({
        success: true,
        variations: variations, 
      });

    } catch (error) {
      console.error("Error in /api/variations:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate variations"
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

      const [originalImageUrl, generatedImageUrl] = await Promise.all([
        uploadImageToStorage(originalImage, "originals"),
        uploadImageToStorage(generatedImage, "generated"),
      ]);

      const design = await storage.saveGeneratedDesign({
        timestamp: Date.now(),
        originalImageUrl,
        generatedImageUrl,
        originalFileName,
        config,
      });
      res.json({ success: true, design });
    } catch (error) {
      console.error("Error saving design:", error);
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

  registerObjectStorageRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}