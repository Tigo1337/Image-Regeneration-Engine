import type { Express } from "express";
import { createServer, type Server } from "http";
import { roomRedesignRequestSchema, smartCropRequestSchema } from "@shared/schema";
import { generateRoomRedesign, analyzeObjectStructure, detectObjectBoundingBox } from "./gemini"; 
import { processImageForGemini, cropImage, padImage, applyPerspectiveMockup } from "./image-utils";
import { storage } from "./storage";
import { uploadImageToStorage } from "./image-storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";
import sharp from "sharp"; 

// Prompt Builder
function buildVariationPrompt(formData: any, variationType: string, structureAnalysis: string = ""): string {
  const style = formData.targetStyle || "the existing style";

  let prompt = `ROLE: Expert Architectural Visualizer.

  TASK: Generate a new view of the room shown in the input image.
  TARGET VIEW: ${variationType.toUpperCase()}.

  === GLOBAL CONSISTENCY CONTRACT (STRICT) ===
  1. THE FROZEN WORLD RULE: The Input Image represents a frozen, existing physical space. You are a photographer moving through it, NOT a designer creating it.
  2. NO REDESIGNING: You are FORBIDDEN from changing the style, furniture, decor, wall colors, flooring, or lighting. 
  3. 1:1 MAPPING: Every single object visible in the Input Image (no matter how small) MUST exist in this new view if the angle permits.
  4. ROOM INTEGRITY: The "Room" is a preserved object. You must not change the wall paint, the floor material, or the baseboard style.

  CRITICAL - HANDLING HIDDEN ANGLES:
  The Input Image only shows the Front. You MUST use the provided "Visual Reference Images" (if any) and the "3D Structure Analysis" below to reconstruct the hidden sides logically.
  `;

  if (structureAnalysis) {
    prompt += `\n\n=== 3D STRUCTURE ANALYSIS (GROUND TRUTH) ===
    Use this technical description to render the details correctly:
    ${structureAnalysis}
    ============================================\n`;
  }

  if (variationType === "Front") {
    prompt += `\n\nINSTRUCTION: FRONT ELEVATION.
    - Camera: Directly perpendicular to the main subject.
    - Perspective: Flattened / Orthographic-like.
    - Goal: A technical evaluation view of the front face.`;
  } 
  else if (variationType === "Side") {
    prompt += `\n\nINSTRUCTION: ANGLE VIEW (45-Degree).
    - Camera: Rotate 45 degrees to the side.
    - "TEXTURE LOCK": The texture on the side of the object (e.g., wood grain, tile pattern, fabric weave) must be CONTINUOUS with the front. Use the Reference Images to determine the side detail.
    - "ROOM EXTENSION (CRITICAL)": The camera rotation reveals more of the back wall. You must PREDICT this new area by strictly EXTENDING the existing wall/floor materials.
      * If the wall is white paint, the new area must be white paint.
      * If the floor is grey tile, the new area must be grey tile.
      * DO NOT ADD NEW OBJECTS (No plants, no windows, no art) unless they are partially visible in the original image.
    - "ATMOSPHERE PRESERVATION": The lighting mood and shadows must match the original image exactly.`;
  } 
  else if (variationType === "Top") {
    prompt += `\n\nINSTRUCTION: ARCHITECTURAL SECTION CUT (TOP VIEW).
    - Camera: 90-degree look-down, directly overhead.
    - ZOOM: Close-up on the main furniture/object. Fill the canvas.
    - "ALIGNMENT": The object must be strictly axis-aligned with the canvas, ensuring all horizontal edges are perfectly parallel to the top and bottom of the image frame.
    - "CEILING REMOVAL": Cut away the ceiling to see inside.
    - "OBJECT PERMANENCE": 
      * EVERY small detail on surfaces (towels, soap, faucets, handles, rugs) MUST be present.
      * Do NOT clean up the room. If there is clutter, render the clutter from above.
      * Wall-mounted items (mirrors, sconces) must be visible as "slices" or profiles attached to the wall line.
    - "ZERO DISTORTION": Walls must be straight lines. Floor patterns must be geometrically perfect from above.`;
  }

  return prompt;
}

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/api/prompts-history", async (req, res) => {
    try {
      if (storage.getPromptLogs) {
        const logs = await storage.getPromptLogs();
        res.json(logs);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompt logs" });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { imageData, prompt, batchSize = 1, ...formData } = req.body;
      const validatedData = roomRedesignRequestSchema.parse(formData);

      if (!imageData) return res.status(400).json({ success: false, error: "No image data" });
      if (!prompt) return res.status(400).json({ success: false, error: "No prompt" });

      const processedImage = await processImageForGemini(imageData);

      const modifiedMainImage = await applyPerspectiveMockup(
        processedImage, 
        validatedData.viewAngle, 
        validatedData.cameraZoom
      );

      console.log(`Generating Master Design: ${validatedData.viewAngle}, Zoom: ${validatedData.cameraZoom}%`);

      let finalPrompt = prompt;
      let computedStructureAnalysis = "";

      const hasRefs = validatedData.referenceImages && validatedData.referenceImages.length > 0;
      const hasDrawing = !!validatedData.referenceDrawing;
      const isAngleChange = validatedData.viewAngle !== "Original";

      if ((isAngleChange || hasRefs) && validatedData.preservedElements) {
        try {
          console.log("3D Analysis Attempted...");
          if (validatedData.structureAnalysis) {
             computedStructureAnalysis = validatedData.structureAnalysis;
             console.log("Using provided 3D Analysis from client.");
          } else {
             computedStructureAnalysis = await analyzeObjectStructure(
              processedImage, 
              validatedData.referenceImages, 
              validatedData.preservedElements
             );
          }

          if (computedStructureAnalysis) {
              finalPrompt += `\n\nCRITICAL CONTEXT - 3D STRUCTURE ANALYSIS:
              Use the following technical analysis to ensure the "${validatedData.preservedElements}" is rendered correctly from the ${validatedData.viewAngle} view:
              ${computedStructureAnalysis}`;
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

      if (storage.createPromptLog) {
        await storage.createPromptLog({
            jobType: "generation",
            prompt: finalPrompt,
            parameters: {
                style: validatedData.targetStyle,
                view: validatedData.viewAngle,
                creativity: validatedData.creativityLevel
            }
        });
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
        structureAnalysis: computedStructureAnalysis 
      });

    } catch (error) {
      console.error("Error in /api/generate:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate room redesign"
      });
    }
  });

  // [UPDATED] Smart Crop Route with "Container Fit" Logic
  app.post("/api/smart-crop", async (req, res) => {
    try {
      const { imageData, ...formData } = req.body;
      const { objectName, fillRatio, aspectRatio } = smartCropRequestSchema.parse(formData);

      if (!imageData) return res.status(400).json({ success: false, error: "No image data" });

      console.log(`Processing Smart Crop: Object=${objectName}, Fill=${fillRatio}%`);

      // 1. Get Coordinates
      const box = await detectObjectBoundingBox(imageData, objectName);

      if (!box) {
          return res.status(404).json({ success: false, error: "Could not detect object specified" });
      }

      const [ymin, xmin, ymax, xmax] = box;
      console.log(`Detection: [${ymin}, ${xmin}, ${ymax}, ${xmax}]`);

      // 2. Load Image Metadata
      const imgBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const metadata = await sharp(imgBuffer).metadata();
      const imgW = metadata.width!;
      const imgH = metadata.height!;

      // 3. Product Dimensions
      const prodW = ((xmax - xmin) / 1000) * imgW;
      const prodH = ((ymax - ymin) / 1000) * imgH;
      const prodCenterX = ((xmin + xmax) / 2000) * imgW;
      const prodCenterY = ((ymin + ymax) / 2000) * imgH;

      // 4. Calculate Ideal Crop
      let targetCropWidth = prodW / (fillRatio / 100);
      let targetCropHeight = targetCropWidth; // Default 1:1

      if (aspectRatio === "9:16") {
          targetCropHeight = targetCropWidth * (16/9);
      } else if (aspectRatio === "16:9") {
          targetCropHeight = targetCropWidth * (9/16);
      } else if (aspectRatio === "4:5") {
          targetCropHeight = targetCropWidth * (5/4);
      } else if (aspectRatio === "Original") {
          const imgRatio = imgH / imgW;
          targetCropHeight = targetCropWidth * imgRatio;
      }

      // 5. [NEW] Container Fit Logic
      // If the calculated crop is larger than the image, shrink it to fit.
      // We calculate a scaling factor that ensures both width and height fit inside the image.

      let scaleFactor = 1.0;

      if (targetCropWidth > imgW) {
         scaleFactor = Math.min(scaleFactor, imgW / targetCropWidth);
      }
      if (targetCropHeight > imgH) {
         scaleFactor = Math.min(scaleFactor, imgH / targetCropHeight);
      }

      // Apply scale (this effectively increases the fill ratio because we are force-zooming in)
      const finalCropWidth = targetCropWidth * scaleFactor;
      const finalCropHeight = targetCropHeight * scaleFactor;

      // 6. Calculate Top/Left with Clamping
      // Ensure the box stays within bounds [0, imgW] and [0, imgH]
      let cropLeft = Math.round(prodCenterX - (finalCropWidth / 2));
      let cropTop = Math.round(prodCenterY - (finalCropHeight / 2));
      const cropWidthInt = Math.floor(finalCropWidth);
      const cropHeightInt = Math.floor(finalCropHeight);

      // Clamp Left/Top
      cropLeft = Math.max(0, Math.min(cropLeft, imgW - cropWidthInt));
      cropTop = Math.max(0, Math.min(cropTop, imgH - cropHeightInt));

      // 7. Extract
      // Since we enforced (width <= imgW) and clamped (left), this is safe.
      const canvas = await sharp(imgBuffer)
        .extract({ 
            left: cropLeft, 
            top: cropTop, 
            width: cropWidthInt, 
            height: cropHeightInt 
        })
        .png()
        .toBuffer();

      const finalBase64 = `data:image/png;base64,${canvas.toString("base64")}`;

      res.json({ success: true, generatedImage: finalBase64 });

    } catch (error) {
      console.error("Smart crop error:", error);
      res.status(500).json({ success: false, error: "Failed to perform smart crop" });
    }
  });

  app.post("/api/variations", async (req, res) => {
    try {
      const { imageData, prompt, selectedVariations, ...formData } = req.body;
      const validatedData = roomRedesignRequestSchema.parse(formData);

      if (!imageData) return res.status(400).json({ success: false, error: "No source image provided" });

      console.log("Generating Additional Perspectives...");
      console.log("Requested views:", selectedVariations);

      let structureAnalysis = validatedData.structureAnalysis || "";

      if (!structureAnalysis && validatedData.referenceImages && validatedData.referenceImages.length > 0 && validatedData.preservedElements) {
        try {
            console.log("Running 3D Structure Analysis for Variations (Not provided by client)...");
            structureAnalysis = await analyzeObjectStructure(
              imageData, 
              validatedData.referenceImages, 
              validatedData.preservedElements
            );
        } catch (e) {
            console.warn("Variation Analysis skipped:", e);
        }
      } else if (structureAnalysis) {
        console.log("Using cached 3D Analysis provided by client.");
      }

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

        if (storage.createPromptLog) {
            await storage.createPromptLog({
                jobType: `variation-${config.type.toLowerCase()}`,
                prompt: specificPrompt,
                parameters: {
                    parentJob: "variation",
                    view: config.type,
                    reusedAnalysis: !!structureAnalysis
                }
            });
        }

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
      const { originalImage, generatedImage, originalFileName, config, variations = [] } = req.body;

      const uploadPromises = [
        uploadImageToStorage(originalImage, "originals"),
        uploadImageToStorage(generatedImage, "generated"),
      ];

      const variationUrls = await Promise.all(variations.map((v: string) => uploadImageToStorage(v, "generated")));

      const [originalImageUrl, generatedImageUrl] = await Promise.all(uploadPromises);

      const design = await storage.saveGeneratedDesign({
        timestamp: Date.now(),
        originalImageUrl,
        generatedImageUrl,
        originalFileName,
        config,
        variations: variationUrls,
      });
      res.json({ success: true, design });
    } catch (error) {
      console.error("Error saving design:", error);
      res.status(500).json({ success: false, error: "Failed to save" });
    }
  });

  app.post("/api/gallery/update", async (req, res) => {
    try {
      const { id, variations } = req.body;
      if (!id || !variations || !Array.isArray(variations)) {
        return res.status(400).json({ success: false, error: "Invalid data" });
      }

      const variationUrls = await Promise.all(variations.map((v: string) => uploadImageToStorage(v, "generated")));

      const existing = await storage.getGeneratedDesign(id);
      const existingVars = (existing?.variations as string[]) || [];
      const allVariations = [...existingVars, ...variationUrls];

      const updated = await storage.updateGeneratedDesign(id, { variations: allVariations });
      res.json({ success: true, design: updated });
    } catch (error) {
      console.error("Error updating design:", error);
      res.status(500).json({ success: false, error: "Failed to update" });
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