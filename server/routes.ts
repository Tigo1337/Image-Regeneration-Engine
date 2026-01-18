import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { roomRedesignRequestSchema, smartCropRequestSchema, dimensionalImageRequestSchema } from "@shared/schema";
import { generateRoomRedesign, analyzeObjectStructure, detectObjectBoundingBox } from "./gemini"; 
import { processImageForGemini, cropImage, padImage, applyPerspectiveMockup, applySmartObjectZoom } from "./image-utils";
import { storage } from "./storage";
import { uploadImageToStorage } from "./image-storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { z } from "zod";
import sharp from "sharp";
import { constructDimensionalPrompt } from "./dimensional-prompt"; 
import { constructRoomScenePrompt, styleDescriptions } from "@shared/prompt-logic";

// Helper to extract userId from authenticated request (or null for anonymous)
function getUserId(req: Request): string | null {
  const user = req.user as any;
  return user?.claims?.sub || null;
}

// Middleware to check if user has active subscription for generation endpoints
async function requireActiveSubscription(req: Request, res: any, next: any) {
  const userId = getUserId(req);
  
  if (!userId) {
    return res.status(401).json({ 
      error: "Authentication required", 
      code: "AUTH_REQUIRED",
      message: "Please sign in to use this feature."
    });
  }

  try {
    const user = await storage.getUser(userId);
    
    if (!user?.stripeSubscriptionId) {
      return res.status(402).json({ 
        error: "Subscription required", 
        code: "SUBSCRIPTION_REQUIRED",
        message: "A Pro subscription is required to generate designs. Visit the pricing page to subscribe."
      });
    }

    // Check subscription status via Stripe
    const { stripeService } = await import("./stripeService");
    const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
    
    if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
      return res.status(402).json({ 
        error: "Subscription inactive", 
        code: "SUBSCRIPTION_INACTIVE",
        message: "Your subscription is not active. Please renew your subscription to continue."
      });
    }

    // Attach subscription info to request for usage reporting
    (req as any).subscriptionInfo = {
      subscriptionId: user.stripeSubscriptionId,
      customerId: user.stripeCustomerId
    };

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    return res.status(500).json({ error: "Failed to verify subscription status" });
  }
}

// Helper to report usage to Stripe after successful generation
async function reportGenerationUsage(req: Request, qualityTier: string) {
  try {
    const subscriptionInfo = (req as any).subscriptionInfo;
    if (!subscriptionInfo?.subscriptionId) return;

    const { stripeService } = await import("./stripeService");
    
    // Get subscription items to find the metered usage item
    const subscription = await stripeService.getSubscription(subscriptionInfo.subscriptionId);
    if (!subscription?.items?.data) return;

    // Find the metered price item matching the quality tier
    // For now, we'll use a simple approach - in production you'd match by price metadata
    const meteredItem = subscription.items.data.find((item: any) => 
      item.price?.recurring?.usage_type === 'metered'
    );

    if (meteredItem) {
      await stripeService.reportUsage(meteredItem.id, 1);
      console.log(`Reported usage for quality: ${qualityTier}`);
    }
  } catch (error) {
    console.error("Usage reporting error:", error);
    // Don't fail the request if usage reporting fails
  }
}

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
  // Setup authentication (MUST be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

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

        const mainImage = await generateRoomRedesign({
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

  // [Smart Crop Route - Full Restore]
  app.post("/api/smart-crop", requireActiveSubscription, async (req, res) => {
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

  // [Variations Route - Full Restore]
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

  // [Modify Route - Full Restore]
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

  // [Dimensional Route - Full Restore]
  app.post("/api/generate-dimensional", requireActiveSubscription, async (req, res) => {
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
        creativityLevel: 2,
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

  // [Gallery Route - Full Restore]
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
        userId: getUserId(req), // Associate with logged-in user if available
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
      const userId = getUserId(req);
      const designs = await storage.getGeneratedDesigns(userId);
      res.json(designs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch" });
    }
  });

  // ============= STRIPE PAYMENT ROUTES =============
  
  // Get Stripe publishable key for frontend
  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const { getStripePublishableKey } = await import("./stripeClient");
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ error: "Failed to get Stripe config" });
    }
  });

  // Get products and prices
  app.get("/api/stripe/products", async (_req, res) => {
    try {
      const { stripeService } = await import("./stripeService");
      const rows = await stripeService.listProductsWithPrices();
      
      // Group prices by product
      const productsMap = new Map<string, any>();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ products: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get user subscription status
  app.get("/api/stripe/subscription", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.json({ subscription: null, hasActiveSubscription: false });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null, hasActiveSubscription: false });
      }

      const { stripeService } = await import("./stripeService");
      const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
      
      const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';
      res.json({ subscription, hasActiveSubscription });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Create checkout session
  app.post("/api/stripe/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "Price ID required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { stripeService } = await import("./stripeService");

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email || "", userId);
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      // Create checkout session
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/pricing?success=true`,
        `${baseUrl}/pricing?canceled=true`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Create billing portal session
  app.post("/api/stripe/portal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No billing account found" });
      }

      const { stripeService } = await import("./stripeService");
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  registerObjectStorageRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}