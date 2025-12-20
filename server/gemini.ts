// Using user's own Google Gemini API key
import { GoogleGenAI, Modality } from "@google/genai";
import sharp from "sharp";

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

// [UPDATED] Universal 3D Analysis Logic
// Now works for ANY object (Couch, Vanity, Bathtub, Chair, etc.)
export async function analyzeObjectStructure(mainImageBase64: string, referenceImages: string[] | undefined, objectName: string): Promise<string> {
  try {
    const mainBase64 = mainImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    console.log(`=== Analyzing 3D Structure for: ${objectName} ===`);

    // Build the prompt parts for the Vision Model
    const promptParts: any[] = [
      { 
        text: `You are an Expert Industrial Designer and 3D Modeler. 

        TASK: Perform a comprehensive "Design Breakdown" of the "${objectName}" shown in the images.
        Your goal is to describe every physical detail so a renderer can reconstruct it perfectly without hallucinations.

        ANALYZE THESE 4 UNIVERSAL DIMENSIONS:

        1. GLOBAL GEOMETRY & SILHOUETTE:
           - What is the primary form? (e.g., Rectangular prism, organic sphere, L-shaped sectional).
           - Describe the edges (Sharp, chamfered, rounded, filleted?).
           - Is the object symmetrical or asymmetrical?

        2. STRUCTURAL COMPONENTS (The "Skeleton"):
           - Break the object down into parts. 
           - If it's furniture: Legs (tapered? block?), Arms (rolled? track?), Back (tight? loose cushion?).
           - If it's cabinetry: Doors (shaker? slab?), Drawers (recessed? overlay?), Hardware (pulls? knobs?).
           - If it's plumbing: Basin shape, rim thickness, faucet mounting points.

        3. SURFACE TOPOGRAPHY (The "Skin"):
           - CRITICAL: Look for relief details. Is the surface flat or textured?
           - Identify: Paneling, fluting, tufting, piping, stitching, carving, or grooves.
           - Describe the depth of these details (e.g., "Deep vertical grooves," "Subtle button tufting").

        4. MATERIAL & FINISH:
           - Describe the interaction with light. (Matte, High-Gloss, Satin, Brushed?).
           - Describe the texture pattern (Wood grain direction, Fabric weave, Marble veining).

        Output a precise, technical description that captures the "Soul" of the object.` 
      },
      // Always include the main image
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: mainBase64
        }
      }
    ];

    // Append all reference images to the prompt
    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((img, index) => {
        // Simple safety check for base64
        if (img && img.includes('base64,')) {
          const refBase64 = img.replace(/^data:image\/[a-z]+;base64,/, '');
          promptParts.push({ text: `\nReference Image ${index + 1}:` });
          promptParts.push({
            inlineData: {
              mimeType: "image/jpeg", 
              data: refBase64
            }
          });
        }
      });
    }

    // Use the Flash model for fast, accurate text analysis
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", 
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
    console.log("Model: gemini-3-pro-image-preview");
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