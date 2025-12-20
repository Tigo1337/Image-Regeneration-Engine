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

/**
 * 3D STRUCTURE ANALYSIS
 * Model: gemini-3-pro-preview
 * Updated Rules: "Forensic Geometry" to prevent style-based hallucinations.
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

        CRITICAL FAILURE AVOIDANCE: 
        Do NOT use broad style labels (like "Beadboard", "Tufted", "Shaker") if they are not mathematically accurate. 
        Style labels cause hallucinations. Describe the PHYSICS, not the VIBE.

        APPLY THE "7-POINT FORENSIC" ANALYSIS RULES:

        1. PRIMITIVE DECOMPOSITION (The Hull):
           - Break the object into simple solids (e.g., "Rectangular chassis, 2:1 aspect ratio").
           - Define the silhouette boundaries.

        2. EXACT QUANTIFICATION (The Count):
           - CRITICAL: Count every repeating element. 
           - If there are vertical planks, COUNT THEM. Do not say "slatted sides". Say "Side panel composed of EXACTLY 4 vertical boards".
           - If there are drawers, count them. "Stack of 3 equal-height drawers".

        3. SURFACE TOPOGRAPHY (The Depth):
           - Describe the "Reveal Depth". How deep are the grooves? 
           - Example: "The V-grooves are approx 3mm deep, creating distinct shadow lines."
           - Contrast this with flat surfaces.

        4. HARDWARE MAPPING (The Anchors):
           - Describe handle/knob geometry strictly (e.g., "Square-profile bar pulls, gold finish").
           - State their exact position relative to the panel edges.

        5. JOINTERY & SEAMS (The Construction):
           - How do surfaces meet? Miters? Butt joints? Overlays?
           - Identify the "Toe Kick" or base structure. Is it recessed? By how much?

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
          // Neutral label to allow AI to determine spatial orientation
          promptParts.push({ text: `\nReference View ${index + 1}:` });
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