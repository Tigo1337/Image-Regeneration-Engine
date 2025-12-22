// server/gemini.ts
import { GoogleGenAI, Modality } from "@google/genai";
import sharp from "sharp";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

interface RoomRedesignParams {
  imageBase64: string;
  referenceImages?: string[]; 
  referenceDrawing?: string;
  preservedElements: string;
  targetStyle: string;
  quality: string;
  aspectRatio: string;
  creativityLevel: number;
  customPrompt?: string;
  outputFormat?: string;
}

// [NEW] Object Detection for Smart Cropping
export async function detectObjectBoundingBox(imageBase64: string, objectName: string): Promise<number[] | null> {
  try {
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    console.log(`=== Smart Crop Detection: ${objectName} ===`);

    // We ask for normalized coordinates (0-1000)
    const prompt = `Return the bounding box for the "${objectName}" in this image. 
    Format: [ymin, xmin, ymax, xmax] 
    Values should be normalized (0-1000). 
    Return ONLY the JSON array. Do not include markdown code blocks.`;

    // Use Flash model for speed/cost if available
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{
        role: "user",
        parts: [
            { text: prompt }, 
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
        ]
      }]
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Detection Raw Output:", text);

    // Clean and Parse the array (e.g., "[200, 100, 800, 900]")
    const match = text.match(/\[(.*?)\]/);
    if (match) {
        const coords = JSON.parse(match[0]);
        if (Array.isArray(coords) && coords.length === 4) {
             return coords;
        }
    }
    return null;
  } catch (e) {
    console.error("Detection failed:", e);
    return null;
  }
}

/**
 * 3D STRUCTURE ANALYSIS
 * Model: gemini-3-pro-preview
 * Updated Rules: "Forensic Geometry" + "Negative Space Counting"
 */
export async function analyzeObjectStructure(mainImageBase64: string, referenceImages: string[] | undefined, objectName: string): Promise<string> {
  try {
    const mainBase64 = mainImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    console.log(`=== Analyzing 3D Structure for: ${objectName} ===`);
    console.log(`Model: gemini-3-pro-preview (Forensic Analysis)`);

    const promptParts: any[] = [
      { 
        text: `You are a Lead Forensic 3D Modeler. 

        TASK: Analyze the "${objectName}" to create a "Manufacturing Spec Sheet".
        Your text will be used to reconstruct this object with 100% geometric accuracy.

        *** CRITICAL INSTRUCTION: MULTI-VIEW SYNTHESIS ***
        You are provided with a Main View and several Reference Views.
        1. TRUST THE REFERENCES: Details visible in the Reference Images (side, back, close-up) are JUST AS IMPORTANT as the Main View. 
        2. FILL THE GAPS: If the Main View occludes the feet, but Reference 1 shows the feet, you MUST document the feet.
        3. MERGE DATA: Stitch all visual data into a single, complete 3D understanding.

        APPLY THE "8-POINT FORENSIC" ANALYSIS RULES:

        0. ZERO-LOSS INVENTORY (The Checklist):
           - List EVERY single sub-component visible across ALL images.
           - Example: [Main Chassis, 4 Legs, 2 Drawer Pulls, 1 Faucet, 1 Backsplash, 1 Drain Stopper].
           - Do not miss small items like hinges, feet, or trim.

        1. PRIMITIVE DECOMPOSITION (The Hull):
           - Break the object into simple solids (e.g., "Rectangular chassis, 2:1 aspect ratio").
           - Define the silhouette boundaries.
           - Mention protrusions: Does the countertop overhang? By how much?

        2. EXACT QUANTIFICATION (The Count):
           - CRITICAL: Count every repeating element. 
           - **GROOVE COUNT (NEGATIVE SPACE):** If there are vertical lines/grooves, count the NEGATIVE SPACES (grooves) separate from the POSITIVE SPACES (planks).
             * Incorrect: "Side panel has vertical planks."
             * Correct: "Side panel has EXACTLY 2 vertical V-grooves, creating 3 equal-width planks."
           - If there are drawers, count them. "Stack of 3 equal-height drawers".

        3. SURFACE TOPOGRAPHY (The Depth):
           - Describe the "Reveal Depth". How deep are the grooves? 
           - **SPACING RHYTHM:** Are the grooves equally spaced? State this explicitly.
           - Example: "The V-grooves are approx 3mm deep, equally spaced 4 inches apart."

        4. HARDWARE MAPPING (The Anchors):
           - Describe handle/knob geometry strictly (e.g., "Square-profile bar pulls, gold finish").
           - State their exact position relative to the panel edges.
           - Note any visible hinges or mounting plates.

        5. JOINTERY & SEAMS (The Construction):
           - How do surfaces meet? Miters? Butt joints? Overlays?
           - **GROUND CONTACT:** Explicitly describe how it meets the floor. Legs? Plinth? Floating? 
           - **WALL CONTACT:** Is there a backsplash? Side splash?

        6. MATERIAL PHYSICS (The Shader):
           - Albedo: Exact color reference (e.g., "Deep Navy, close to Pantone 19-4024").
           - Roughness: "Satin lacquer" vs "High gloss".
           - Metalness: "Brushed brass with horizontal grain".

        7. NEGATIVE SPACE (The Void):
           - Define the empty spaces explicitly.
           - "The space between the floor and cabinet bottom is open/solid?"

        OUTPUT FORMAT:
        Technical bullet points only. No fluff. Use engineering terminology.` 
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: mainBase64
        }
      }
    ];

    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((img, index) => {
        if (img && img.includes('base64,')) {
          const refBase64 = img.replace(/^data:image\/[a-z]+;base64,/, '');
          // Explicit label to force the model to look at it
          promptParts.push({ text: `\n[REFERENCE IMAGE ${index + 1} - Look for hidden details here]:` });
          promptParts.push({
            inlineData: {
              mimeType: "image/jpeg", 
              data: refBase64
            }
          });
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: [
        {
          role: "user",
          parts: promptParts
        }
      ]
    });

    const description = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Analysis Result:", description.substring(0, 150) + "...");
    return description;

  } catch (error) {
    console.error("Analysis failed (Model unavailable or Error), skipping 3D context injection:", error);
    return ""; 
  }
}

/**
 * IMAGE REGENERATION
 * Model: gemini-3-pro-image-preview (Nano Banana Pro)
 */
export async function generateRoomRedesign(params: RoomRedesignParams): Promise<string> {
  const { 
    imageBase64, 
    referenceImages = [],
    referenceDrawing,
    customPrompt, 
    quality, 
    aspectRatio, 
    creativityLevel, 
    outputFormat = "PNG" 
  } = params;

  try {
    // 1. Prepare Main Image
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // 2. Build the Content Parts
    const parts: any[] = [
      { text: customPrompt || "Create a beautiful interior design image." }
    ];

    // Main Canvas Image
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    });

    // 3. Inject Reference Images
    if (referenceImages.length > 0) {
      console.log(`Injecting ${referenceImages.length} Visual Reference Images into Generation Context...`);

      parts.push({ 
        text: `\n\nCRITICAL VISUAL REFERENCES:\nThe following images show the EXACT object to be preserved. Use them to understand its geometry, material, and surface details (like paneling, tufting, or hardware) from multiple angles. Do not redesign this object.` 
      });

      referenceImages.forEach((ref) => {
        if (ref && ref.includes('base64,')) {
          const refBase64 = ref.replace(/^data:image\/[a-z]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: refBase64
            }
          });
        }
      });
    }

    // 4. Inject Technical Drawing
    if (referenceDrawing) {
      console.log("Injecting Technical Drawing into Generation Context...");

      const isPdf = referenceDrawing.includes('application/pdf');
      const mimeType = isPdf ? 'application/pdf' : 'image/jpeg';
      const drawingBase64 = referenceDrawing.split(',')[1];

      parts.push({
        text: `\n\nTECHNICAL DRAWING REFERENCE:\nThe following input is a Technical Drawing / Blueprint. Use the dimensions, orthographic views, and scale provided in this document to ensure the object is rendered with 100% geometric accuracy. This document takes precedence over all other inputs regarding shape.`
      });

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: drawingBase64
        }
      });
    }

    // Configuration Maps
    const qualityToImageSizeMap: Record<string, string> = {
      "Standard": "1K",
      "High Fidelity (2K)": "2K",
      "Ultra (4K)": "4K"
    };

    const formatToMimeTypeMap: Record<string, string> = {
      "PNG": "image/png",
      "JPEG": "image/jpeg",
      "WebP": "image/webp"
    };

    const temperature = typeof creativityLevel === 'number' 
      ? (creativityLevel / 100) * 2.0 
      : 1.0;

    const config: any = {
      responseModalities: [Modality.IMAGE],
      temperature: temperature, 
    };

    const imageConfig: any = {};

    if (quality in qualityToImageSizeMap) {
      imageConfig.imageSize = qualityToImageSizeMap[quality];
    }

    if (aspectRatio && aspectRatio !== "Original") {
      imageConfig.aspectRatio = aspectRatio;
    }

    if (Object.keys(imageConfig).length > 0) {
      config.imageConfig = imageConfig;
    }

    console.log("=== Gemini Image Generation API Request ===");
    console.log("Model: gemini-3-pro-image-preview (Nano Banana Pro)");
    console.log("Input Parts Count:", parts.length);
    console.log("Aspect Ratio:", imageConfig.aspectRatio || "Default");
    console.log("Has Drawing:", !!referenceDrawing);
    console.log("==========================================");

    const imageResponse = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        {
          role: "user",
          parts: parts
        }
      ],
      config,
    });

    console.log("=== Gemini API Response ===");
    const candidate = imageResponse.candidates?.[0];

    if (!candidate?.content?.parts?.[0]) {
       console.error("Gemini returned no content. Safety ratings:", candidate?.safetyRatings);
       throw new Error("Gemini refused to generate the image (Safety or Filter block).");
    }

    const imagePart = candidate.content.parts.find((part: any) => part.inlineData);

    if (!imagePart?.inlineData?.data) {
      throw new Error("No image data in Gemini response");
    }

    let imageData = imagePart.inlineData.data;
    let mimeType = imagePart.inlineData.mimeType || "image/png";

    // Convert format if necessary
    const targetMimeType = formatToMimeTypeMap[outputFormat];
    if (targetMimeType && mimeType !== targetMimeType) {
      console.log("Converting image from", mimeType, "to", targetMimeType);
      const imageBuffer = Buffer.from(imageData, 'base64');
      let sharpFormat: keyof sharp.FormatEnum = 'png';
      if (outputFormat === 'JPEG') sharpFormat = 'jpeg';
      else if (outputFormat === 'WebP') sharpFormat = 'webp';

      const convertedBuffer = await sharp(imageBuffer).toFormat(sharpFormat).toBuffer();
      imageData = convertedBuffer.toString('base64');
      mimeType = targetMimeType;
    }

    return `data:${mimeType};base64,${imageData}`;
  } catch (error) {
    console.error("=== Gemini API Error ===");
    console.error("Error details:", error);
    throw new Error(`Failed to generate room redesign: ${error instanceof Error ? error.message : String(error)}`);
  }
}