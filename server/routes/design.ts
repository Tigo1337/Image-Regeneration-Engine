import type { Express } from "express";
import { roomRedesignRequestSchema } from "@shared/schema";
import { generateRoomRedesign, analyzeObjectStructure, detectObjectBoundingBox } from "../gemini";
import { processImageForGemini, applyPerspectiveMockup, applySmartObjectZoom } from "../image-utils";
import { storage } from "../storage";
import { uploadImageToStorage } from "../image-storage";
import { getUserId, requireActiveSubscription, reportGenerationUsage } from "../middleware/auth";
import { buildVariationPrompt } from "../lib/prompt-utils";
import { constructRoomScenePrompt } from "@shared/prompt-logic";
import sharp from "sharp";

export function registerDesignRoutes(app: Express) {
  // Main Generation Endpoint
  app.post("/api/generate", requireActiveSubscription, async (req, res) => {
    try {
      const { imageData, prompt, inspirationImages, ...formData } = req.body;
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

        const rawGeneratedImage = await generateRoomRedesign({
          imageBase64: modifiedMainImage,
          referenceImages: validatedData.referenceImages,
          inspirationImages: inspirationImages,
          referenceDrawing: validatedData.referenceDrawing,
          preservedElements: validatedData.preservedElements,
          targetStyle: validatedData.targetStyle,
          quality: validatedData.quality,
          aspectRatio: validatedData.aspectRatio,
          creativityLevel: validatedData.creativityLevel, 
          customPrompt: finalPrompt, 
          outputFormat: validatedData.outputFormat,
        });

        // [BILL C-27 COMPLIANCE] Inject Invisible Watermark Metadata
        // This MUST be in the app code, it cannot be done by a landing page.
        const imageBuffer = Buffer.from(rawGeneratedImage.replace(/^data:image\/\w+;base64,/, ""), "base64");
        const taggedBuffer = await sharp(imageBuffer)
          .withMetadata({
            exif: {
              IFD0: {
                ImageDescription: "AI Generated by Doculoom. Compliant with Bill C-27 (AIDA).",
                Copyright: "© 2026 Doculoom",
                Software: "Gemini 3 Pro Nano Banana"
              }
            }
          })
          .toBuffer();

        // Convert back to base64 for frontend
        const mainImage = `data:image/png;base64,${taggedBuffer.toString('base64')}`;

        // SAVE EACH RESULT TO GALLERY AUTOMATICALLY
        const generatedImageUrl = await uploadImageToStorage(mainImage, "generated");
        await storage.saveGeneratedDesign({
          userId: getUserId(req), // Associate with logged-in user if available
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

      // Report usage to Stripe (skipped for super admins)
      await reportGenerationUsage(req, validatedData.quality);

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
  app.post("/api/generate/batch-styles", requireActiveSubscription, async (req, res) => {
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

      const results: {style: string; image: string; error?: string}[] = [];

      for (const style of styles) {
        try {
          console.log(`Generating style: ${style}`);

          // UNIFIED PROMPT LOGIC: 
          const prompt = constructRoomScenePrompt({
            promptType: "room-scene",
            style: style,
            preservedElements: formData.preservedElements || "",
            addedElements: formData.addedElements || "",
            viewAngle: formData.viewAngle || "Original",
            cameraZoom: formData.cameraZoom || 100,
            creativityLevel: formData.creativityLevel || 2,
          });

          const generatedImage = await generateRoomRedesign({
            imageBase64: modifiedMainImage,
            referenceImages: formData.referenceImages,
            inspirationImages: formData.inspirationImages,
            referenceDrawing: formData.referenceDrawing,
            preservedElements: formData.preservedElements || "",
            targetStyle: style,
            quality: formData.quality || "Standard",
            aspectRatio: formData.aspectRatio || "Original",
            creativityLevel: formData.creativityLevel || 2,
            customPrompt: prompt,
            outputFormat: formData.outputFormat || "PNG",
          });

          // SAVE TO GALLERY
          const generatedImageUrl = await uploadImageToStorage(generatedImage, "generated");
          await storage.saveGeneratedDesign({
            userId: getUserId(req), // Associate with logged-in user if available
            timestamp: Date.now(),
            originalImageUrl,
            generatedImageUrl,
            originalFileName: `${formData.originalFileName || "batch"}_${style}`,
            config: { ...formData, targetStyle: style, prompt },
            variations: [],
          });

          // LOG EVERY STYLE GENERATION (Added logging fix here)
          if (storage.createPromptLog) {
              await storage.createPromptLog({
                  jobType: "batch-style-generation",
                  prompt: prompt,
                  parameters: {
                      style: style,
                      creativity: formData.creativityLevel || 2,
                      originalFileName: formData.originalFileName || "batch",
                      viewAngle: formData.viewAngle || "Original"
                  }
              });
          }

          results.push({ style, image: generatedImage });
        } catch (error) {
          console.error(`Error generating style ${style}:`, error);
          results.push({ style, image: "", error: error instanceof Error ? error.message : "Generation failed" });
        }
      }

      // Report usage for batch generation (skipped for super admins)
      // Fire-and-forget to avoid blocking response
      const successfulCount = results.filter(r => r.image && !r.error).length;
      if (successfulCount > 0 && !(req as any).isSuperAdmin) {
        const subscriptionInfo = (req as any).subscriptionInfo;
        if (subscriptionInfo?.customerId) {
          import("../stripeService").then(({ stripeService }) => {
            stripeService.reportMeterEvent(subscriptionInfo.customerId, formData.quality || "Standard", successfulCount)
              .catch(err => console.error("Batch usage reporting error:", err));
          });
        }
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

  // Variations Route
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
          creativityLevel: 2, 
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
}
