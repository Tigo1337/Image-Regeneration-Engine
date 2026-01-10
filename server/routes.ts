import type { Express } from "express";
import { createServer, type Server } from "http";
import { roomRedesignRequestSchema, smartCropRequestSchema, dimensionalImageRequestSchema } from "@shared/schema";
import { generateRoomRedesign, analyzeObjectStructure, detectObjectBoundingBox } from "./gemini"; 
import { processImageForGemini, cropImage, padImage, applyPerspectiveMockup, applySmartObjectZoom } from "./image-utils";
import { storage } from "./storage";
import { uploadImageToStorage } from "./image-storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";
import sharp from "sharp";
import { constructDimensionalPrompt } from "./dimensional-prompt"; 

// Updated Materiality-Focused Style Descriptions
const styleDescriptions: Record<string, string> = {
  "Scandinavian": "Focus on high-contrast textures over color. Utilize a 'Hygge' atmosphere with a mix of matte light woods, tactile wool fabrics, and soft ambient natural light. The palette should be monochromatic but rich in material variety",
  "Modern": "A study in 'Less is More' through geometric discipline. Emphasize large-scale unadorned surfaces, the interplay of shadow and light on flat planes, and a sophisticated mix of cold metals (steel/chrome) against warm natural stone",
  "Contemporary": "A fluid aesthetic defined by soft-touch finishes and organic curves. Balance high-gloss surfaces with deep-pile textiles. Focus on the interplay of mixed metals and sculptural, diffused lighting that highlights rounded architectural forms",
  "Boho": "A 'Collected, Not Decorated' aesthetic. Lean into an organic, maximalist-light approach using highly varied natural textures like woven seagrass, raw terracotta, and layered patterned textiles. Lighting should feel warm and sun-drenched",
  "Industrial": "Emphasize the beauty of raw, 'unfinished' materials. Contrast the cold, hard texture of polished concrete and black iron piping with the warmth of deep-grained reclaimed wood and exposed, patinated brickwork",
  "Mid-Century Modern": "Highlight the contrast between organic wood grains (teak/walnut) and smooth synthetic polymers. Focus on low-profile geometry, matte-finish cabinetry, and punctuated pops of saturated primary colors through textile and glass",
  "Farmhouse": "Defined by 'Worn-In' comfort. Prioritize matte, chalky paint finishes, wide-planked distressed wood, and tactile fabrics like linen and burlap. Use galvanized metals and oversized fixtures to create a sense of scale",
  "Coastal": "Capture the essence of air and light. Use a palette of bleached woods, crisp cottons, and weathered driftwood textures. Lighting should be bright and overexposed, mimicking a reflective seaside atmosphere",
  "Transitional": "A sophisticated equilibrium between heritage and modernism. Blend the tactile weight of traditional crown molding with the sleek, neutral surfaces of contemporary design. Focus on taupe and beige tonality with rich fabric layering",
  "Japandi": "The intersection of Scandi-function and Japanese wabi-sabi. Use light-toned bamboo, slatted wood partitions, and stone surfaces with natural imperfections. Keep lines horizontal and low, emphasizing quietude and matte finishes",
  "Maximalist": "A high-drama celebration of saturated jewel tones and tactile abundance. Layer velvet, silk, and brocade against ornate gold details. Focus on rhythmic patterns and the complex interplay of shadows in a heavily curated space",
  "Art Deco": "Architectural glamour defined by 'The Machine Age.' Prioritize polished marble, brushed gold hardware, and fluted glass textures. Use high-contrast symmetry and tiered lighting to create a sense of verticality and opulence",
  "Biophilic": "Blur the line between interior and exterior. Integrate living moss textures, river-stone transitions, and raw teak. Focus on abundant, unfiltered natural light and the moisture-rich atmosphere of a greenhouse",
  "Desert Modern": "Inspired by arid landscapes. Use sun-baked terracotta, plaster tadelakt walls, and sandy, abrasive textures. Contrast these with matte black fixtures and sharp, dramatic architectural shadows from the high sun",
  "Moody Luxe": "A 'Hotel-Spa' atmosphere defined by obsidian stone and charcoal wood. Use backlit surfaces and integrated LED strips to create high-contrast highlights on dark, velvet-smooth cabinetry and chrome accents",
  "Mediterranean": "Sun-drenched and earthy. Focus on hand-painted ceramic glaze, lime-washed plaster walls, and weathered bronze. The flooring should feel cool to the touch with terracotta or stone tiles under a warm, golden light",
  "Zen Spa": "The ultimate in sensory reduction. Use slatted wood partitions to create rhythmic shadows, smooth river rocks, and floating stone vanities. Lighting must be soft, diffused, and indirect to mimic a steam-filled sanctuary",
  "Mountain Modern": "Rugged gravity meets clean lines. Utilize heavy timber beams with visible grain, slate stone flooring, and floor-to-ceiling glass. The materiality should feel defensive against the elements but plush and warm internally",
  "Soft Modern": "A gentler take on minimalism. Focus on beige microcement, brushed nickel, and radius (curved) edges. The atmosphere should feel 'hush-toned' with neutral palettes and plush, enveloping textiles",
  "Modern Farmhouse": "High-contrast architectural clarity. Combine the sharpness of black steel window frames with the soft, organic texture of white marble and shaker-style cabinetry. Focus on clean lines and polished hardware",
  "Industrial Chic": "A refined take on raw materials. Pair polished, high-gloss concrete with sophisticated glass partitions. Use black steel for structural accents but soften the atmosphere with high-thread-count white textiles",
  "Dark Scandi": "The 'Noir' side of Hygge. Utilize smoked oak or walnut, deep slate-grey matte walls, and cozy, heavy-knit textures. Focus on low-level 'pools' of warm light against dark, minimalist functionalism",
  "Wabi-Sabi Japandi": "Appreciate the beauty of the aged and irregular. Use rough-hewn stone, textured lime plaster, and irregular wooden forms. The palette should be muted and earthy, emphasizing the 'honesty' of raw materials",
  "Victorian": "Ornate materiality and historical weight. Focus on intricate wood carvings, heavy brass patina, and etched glass. Use deep, saturated tones like mahogany and emerald, highlighted by the flickering quality of candlelight",
  "Hollywood Regency": "Cinematic glamour. Use high-gloss lacquered surfaces, mirrored furniture, and metallic gold accents. The atmosphere should be theatrical, featuring high-contrast black-and-white floors and velvet-clad focal points",
  "French Country": "Elegant rusticity. Combine distressed white-washed wood with soft lavender or cream palettes. Focus on curved cabinetry, wrought iron details, and the tactile quality of stone tile and toile fabrics",
  "Brutalist": "Monolithic and raw. Emphasize the massive weight of unpolished concrete and blocky geometric forms. Use monochromatic grey tones and dramatic architectural shadows to highlight the rugged, honest texture of the build",
  "Tropical": "Exotic and ventilated. Use dark mahogany, woven rattan, and large-scale leafy greenery. Focus on the transition between indoor stone floors and outdoor bamboo textures, with turquoise accents mimicking water",
  "Southwestern": "Adobe-inspired textures. Use sunset hues (pink, orange, clay) against stucco walls. Prioritize the woven texture of tribal rugs and the cool, matte touch of turquoise stone and terracotta clay tiles",
  "Ultra-Minimalist": "Clinical precision and zero visual noise. Use large-format porcelain slabs, handle-less cabinetry, and frameless glass. Everything is hidden; focus on the perfection of the white-on-white material joinery",
  "Grandmillennial": "Nostalgic and layered. Use chintz florals, scalloped wicker, and needlepoint textures. The palette is a mix of pastels and 'heirloom' wood finishes, creating a cozy, storied, and slightly eccentric atmosphere",
  "Eclectic": "A curation of historical layers. Mix matte vintage woods with high-gloss modern metals. Focus on the harmony found in diversity—pairing unexpected color pops with a variety of textures like velvet, leather, and glass",
  "Rustic": "The raw power of nature. Use unfinished log walls, massive stone boulders, and hand-forged copper. The atmosphere is defined by the smell and feel of leather, chunky wool, and warm amber lighting",
  "Neo-Classical": "Formal, dignified elegance. Use Hellenic marble columns, muted gold leaf, and symmetrical crown moldings. Focus on the cool, smooth touch of stone statues against cream-colored silk-finish walls",
  "Memphis Design": "A playful, pop-art rebellion. Use high-contrast primary colors, black-and-white zig-zag patterns, and terrazzo surfaces. Focus on whimsical geometric forms and matte plastic or laminate finishes",
  "Bauhaus": "Industrial functionalism. Use tubular steel frames, glass block walls, and primary color accents. The materiality is a mix of leather, chrome, and smooth geometric purity where 'form follows function'",
  "Retro Futurism": "The 'Space Age' imagined from the past. Use chrome spheres, neon backlighting, and sleek synthetic curves. Focus on silver and metallic white surfaces that feel like a polished spaceship interior",
  "Organic Modern": "Sculptural and grounded. Use soft lime-plaster walls, driftwood accents, and linen curtains. Focus on 'pebble' shapes—smooth, rounded, and handcrafted—in a warm, off-white earth-toned palette",
  "Gothic Noir": "Mysterious and heavy. Use dark velvet drapes, wrought iron candelabras, and deep burgundy granite. Emphasize pointed arches and the intricate, dark-stained grain of carved wood",
  "Shabby Chic": "Romantic, airy, and time-worn. Use distressed, white-washed furniture with faded paint textures. Focus on ruffled linens, vintage crystal, and a soft pastel palette that feels lived-in and nostalgic",
};

// Prompt Builder for Perspectives
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

  prompt += `\n\nMATERIALITY & LIGHTING COHERENCE:
  1. Identify the primary light source in the original image. Maintain this light vector.
  2. Focus on material depth (wood grain, stone texture, fabric weave). 
  3. The surface quality must be consistent across all objects.`;

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
      const { imageData, prompt, ...formData } = req.body;
      const validatedData = roomRedesignRequestSchema.parse(formData);

      if (!imageData) return res.status(400).json({ success: false, error: "No image data" });
      if (!prompt) return res.status(400).json({ success: false, error: "No prompt" });

      const batchSize = validatedData.batchSize || 1;
      const processedImage = await processImageForGemini(imageData);

      let modifiedMainImage = processedImage;
      let finalPrompt = prompt;

      // Check for Smart Zoom vs Manual Zoom
      if (validatedData.useSmartZoom && validatedData.smartZoomObject && validatedData.smartFillRatio) {
         console.log(`Applying Smart Object Zoom on "${validatedData.smartZoomObject}" at ${validatedData.smartFillRatio}%`);

         const box = await detectObjectBoundingBox(processedImage, validatedData.smartZoomObject);
         if (box) {
            modifiedMainImage = await applySmartObjectZoom(
                processedImage, 
                box, 
                validatedData.smartFillRatio
            );

            // Inject Explicit Size Instruction into Prompt
            finalPrompt += `\n\n=== COMPOSITION CONSTRAINT (STRICT) ===
            The input image has been strictly cropped so that the "${validatedData.smartZoomObject}" occupies exactly ${validatedData.smartFillRatio}% of the canvas width.
            1. LOCK CAMERA DISTANCE: You are FORBIDDEN from zooming in or out. Maintain this exact frame.
            2. PRESERVE SCALE: The edges of the ${validatedData.smartZoomObject} must align perfectly with the input image. 
            3. FILL RATIO: Ensure the object remains ${validatedData.smartFillRatio}% of the image width in your final generation.`;

         } else {
            console.warn("Smart Zoom: Object not found, falling back to original.");
         }
      } else {
         // Fallback to manual slider zoom
         modifiedMainImage = await applyPerspectiveMockup(
            processedImage, 
            validatedData.viewAngle, 
            validatedData.cameraZoom
         );
      }

      console.log(`Generating Master Design: ${validatedData.viewAngle} (Batch Size: ${batchSize})`);

      let computedStructureAnalysis = "";

      const hasRefs = validatedData.referenceImages && validatedData.referenceImages.length > 0;
      const hasDrawing = !!validatedData.referenceDrawing;
      const isAngleChange = validatedData.viewAngle !== "Original";

      if ((isAngleChange || hasRefs) && validatedData.preservedElements) {
        try {
          if (validatedData.structureAnalysis) {
             computedStructureAnalysis = validatedData.structureAnalysis;
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

      // Upload original once for gallery association
      const originalImageUrl = await uploadImageToStorage(imageData, "originals");
      const generatedImages = [];

      for (let i = 0; i < batchSize; i++) {
        console.log(`Processing variation ${i+1}/${batchSize}...`);

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

        // SAVE EACH RESULT TO GALLERY AUTOMATICALLY
        const generatedImageUrl = await uploadImageToStorage(mainImage, "generated");
        await storage.saveGeneratedDesign({
          timestamp: Date.now(),
          originalImageUrl,
          generatedImageUrl,
          originalFileName: validatedData.originalFileName || "design",
          config: { ...validatedData, prompt: finalPrompt },
          variations: [],
        });

        // LOGGING LOGIC - Moved inside loop to log every individual generation
        if (storage.createPromptLog) {
            await storage.createPromptLog({
                jobType: "generation",
                prompt: finalPrompt,
                parameters: {
                    style: validatedData.targetStyle,
                    view: validatedData.viewAngle,
                    creativity: validatedData.creativityLevel,
                    batchIndex: i + 1,
                    batchTotal: batchSize
                }
            });
        }

        generatedImages.push(mainImage);
      }

      res.json({
        success: true,
        generatedImage: generatedImages[0],
        allImages: generatedImages,
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

  // Batch Styles Generation Endpoint
  app.post("/api/generate/batch-styles", async (req, res) => {
    try {
      const { imageData, formData, styles } = req.body;

      if (!imageData) return res.status(400).json({ success: false, error: "No image data" });
      if (!styles || !Array.isArray(styles) || styles.length === 0) {
        return res.status(400).json({ success: false, error: "No styles specified" });
      }

      console.log(`Batch Style Generation Started: ${styles.length} styles`);

      const processedImage = await processImageForGemini(imageData);
      const originalImageUrl = await uploadImageToStorage(imageData, "originals");

      // Apply preprocessing
      let modifiedMainImage = processedImage;
      if (formData.useSmartZoom && formData.smartZoomObject && formData.smartFillRatio) {
        const box = await detectObjectBoundingBox(processedImage, formData.smartZoomObject);
        if (box) {
          modifiedMainImage = await applySmartObjectZoom(processedImage, box, formData.smartFillRatio);
        }
      } else {
        modifiedMainImage = await applyPerspectiveMockup(
          processedImage, 
          formData.viewAngle || "Original", 
          formData.cameraZoom || 100
        );
      }

      const CONCURRENCY = 3;
      const results: {style: string; image: string; error?: string}[] = [];

      for (let i = 0; i < styles.length; i += CONCURRENCY) {
        const batch = styles.slice(i, i + CONCURRENCY);
        const batchPromises = batch.map(async (style: string) => {
          try {
            console.log(`Generating style: ${style}`);

            const styleDesc = styleDescriptions[style] || styleDescriptions["Modern"];
            const creativity = formData.creativityLevel || 50;

            // Sync Creativity/Variance Logic
            let styleGuidance = "";
            if (creativity < 30) {
                styleGuidance = `Follow the ${style} aesthetic with clinical, textbook precision.`;
            } else if (creativity < 70) {
                styleGuidance = `Provide a standard, balanced interpretation of the ${style} aesthetic.`;
            } else {
                styleGuidance = `Provide a unique, 'Designer Signature' take on ${style} with avant-garde lighting.`;
            }

            let prompt = `You are an expert interior designer and architectural visualizer.

TASK: Transform this room into a beautiful "${style}" style interior.
STYLE DIRECTION: ${styleGuidance}
STYLE DEFINITION: ${styleDesc}

MATERIALITY DIRECTIVE: 
Interpret the style primarily through material depth and surface quality. Focus on how light interacts with different textures (e.g., wood grain, stone, textiles). Prioritize tactile realism.

PRESERVED ELEMENTS: ${formData.preservedElements || "No specific elements to preserve"}
${formData.addedElements ? `ADDED ELEMENTS: ${formData.addedElements}` : ""}

CRITICAL INSTRUCTION - PERSPECTIVE LOCK:
Maintain the EXACT camera angle and perspective of the original input image.

Generate a photorealistic interior design rendering in the "${style}" style.`;

            const generatedImage = await generateRoomRedesign({
              imageBase64: modifiedMainImage,
              referenceImages: formData.referenceImages,
              referenceDrawing: formData.referenceDrawing,
              preservedElements: formData.preservedElements || "",
              targetStyle: style,
              quality: formData.quality || "Standard",
              aspectRatio: formData.aspectRatio || "Original",
              creativityLevel: creativity,
              customPrompt: prompt,
              outputFormat: formData.outputFormat || "PNG",
            });

            // SAVE TO GALLERY
            const generatedImageUrl = await uploadImageToStorage(generatedImage, "generated");
            await storage.saveGeneratedDesign({
              timestamp: Date.now(),
              originalImageUrl,
              generatedImageUrl,
              originalFileName: `${formData.originalFileName || "batch"}_${style}`,
              config: { ...formData, targetStyle: style, prompt },
              variations: [],
            });

            // LOG EVERY STYLE GENERATION
            if (storage.createPromptLog) {
                await storage.createPromptLog({
                    jobType: "batch-style-generation",
                    prompt: prompt,
                    parameters: {
                        style: style,
                        creativity: creativity,
                        originalFileName: formData.originalFileName
                    }
                });
            }

            return { style, image: generatedImage };
          } catch (error) {
            console.error(`Error generating style ${style}:`, error);
            return { style, image: "", error: error instanceof Error ? error.message : "Generation failed" };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      res.json({
        success: true,
        results
      });

    } catch (error) {
      console.error("Error in /api/generate/batch-styles:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate batch styles"
      });
    }
  });

  // [Smart Crop Route - Preserved]
  app.post("/api/smart-crop", async (req, res) => {
    try {
      const { imageData, ...formData } = req.body;
      const { objectName, fillRatio, aspectRatio } = smartCropRequestSchema.parse(formData);

      if (!imageData) return res.status(400).json({ success: false, error: "No image data" });

      const box = await detectObjectBoundingBox(imageData, objectName);

      if (!box) {
          return res.status(404).json({ success: false, error: "Could not detect object specified" });
      }

      const [ymin, xmin, ymax, xmax] = box;

      const imgBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const metadata = await sharp(imgBuffer).metadata();
      const imgW = metadata.width!;
      const imgH = metadata.height!;

      const prodW = ((xmax - xmin) / 1000) * imgW;
      const prodH = ((ymax - ymin) / 1000) * imgH;
      const prodCenterX = ((xmin + xmax) / 2000) * imgW;
      const prodCenterY = ((ymin + ymax) / 2000) * imgH;

      let targetCropWidth = prodW / (fillRatio / 100);
      let targetCropHeight = targetCropWidth; 

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

      let scaleFactor = 1.0;
      if (targetCropWidth > imgW) scaleFactor = Math.min(scaleFactor, imgW / targetCropWidth);
      if (targetCropHeight > imgH) scaleFactor = Math.min(scaleFactor, imgH / targetCropHeight);

      const finalCropWidth = targetCropWidth * scaleFactor;
      const finalCropHeight = targetCropHeight * scaleFactor;

      let cropLeft = Math.round(prodCenterX - (finalCropWidth / 2));
      let cropTop = Math.round(prodCenterY - (finalCropHeight / 2));
      const cropWidthInt = Math.floor(finalCropWidth);
      const cropHeightInt = Math.floor(finalCropHeight);

      cropLeft = Math.max(0, Math.min(cropLeft, imgW - cropWidthInt));
      cropTop = Math.max(0, Math.min(cropTop, imgH - cropHeightInt));

      const srcLeft = Math.max(0, cropLeft);
      const srcTop = Math.max(0, cropTop);
      const srcRight = Math.min(imgW, cropLeft + cropWidthInt);
      const srcBottom = Math.min(imgH, cropTop + cropHeightInt);

      const srcWidth = srcRight - srcLeft;
      const srcHeight = srcBottom - srcTop;

      const extractedPiece = await sharp(imgBuffer)
        .extract({ left: srcLeft, top: srcTop, width: srcWidth, height: srcHeight })
        .toBuffer();

      const canvas = await sharp({
        create: {
          width: cropWidthInt,
          height: cropHeightInt,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0 } 
        }
      })
      .composite([{
        input: extractedPiece,
        top: srcTop - cropTop,
        left: srcLeft - cropLeft
      }])
      .png()
      .toBuffer();

      const finalBase64 = `data:image/png;base64,${canvas.toString("base64")}`;

      res.json({ success: true, generatedImage: finalBase64 });

    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to perform smart crop" });
    }
  });

  app.post("/api/variations", async (req, res) => {
    try {
      const { imageData, prompt, selectedVariations, ...formData } = req.body;
      const validatedData = roomRedesignRequestSchema.parse(formData);

      if (!imageData) return res.status(400).json({ success: false, error: "No source image provided" });

      let structureAnalysis = validatedData.structureAnalysis || "";

      if (!structureAnalysis && validatedData.referenceImages && validatedData.referenceImages.length > 0 && validatedData.preservedElements) {
        try {
            structureAnalysis = await analyzeObjectStructure(
              imageData, 
              validatedData.referenceImages, 
              validatedData.preservedElements
            );
        } catch (e) {
            console.warn("Variation Analysis skipped:", e);
        }
      }

      const variationConfigs = [
        { type: "Front", preprocess: async (img: string) => await applyPerspectiveMockup(img, "Front", 100) },
        { type: "Side", preprocess: async (img: string) => await applyPerspectiveMockup(img, "Side", 100) },
        { type: "Top", preprocess: async (img: string) => await applyPerspectiveMockup(img, "Top", 135) }
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

  app.post("/api/generate-dimensional", async (req, res) => {
    try {
      const { imageData, ...formData } = req.body;
      const validatedData = dimensionalImageRequestSchema.parse(formData);

      if (!imageData) {
        return res.status(400).json({ success: false, error: "No image data provided" });
      }

      const processedImage = await processImageForGemini(imageData);
      const dimensionalPrompt = constructDimensionalPrompt(validatedData);

      const generatedImage = await generateRoomRedesign({
        imageBase64: processedImage,
        preservedElements: "the entire product",
        targetStyle: "Technical Documentation",
        quality: "High Fidelity (2K)",
        aspectRatio: "1:1",
        creativityLevel: 10,
        customPrompt: dimensionalPrompt,
        outputFormat: "PNG",
      });

      res.json({
        success: true,
        generatedImage,
        prompt: dimensionalPrompt,
      });

    } catch (error) {
      console.error("Error in /api/generate-dimensional:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate dimensional image",
      });
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