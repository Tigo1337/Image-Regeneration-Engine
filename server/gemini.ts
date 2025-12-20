// Using user's own Google Gemini API key
import { GoogleGenAI, Modality } from "@google/genai";
import sharp from "sharp";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

interface RoomRedesignParams {
  imageBase64: string;
  referenceImages?: string[]; 
  preservedElements: string;
  targetStyle: string;
  quality: string;
  aspectRatio: string;
  creativityLevel: number;
  customPrompt?: string;
  outputFormat?: string;
}

export async function analyzeObjectStructure(mainImageBase64: string, referenceImages: string[] | undefined, objectName: string): Promise<string> {
  try {
    return ""; 
  } catch (error) {
    return ""; 
  }
}

export async function generateRoomRedesign(params: RoomRedesignParams): Promise<string> {
  const { 
    imageBase64, 
    referenceImages = [], 
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

    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    });

    // 3. Inject Reference Images (Safe Mode)
    if (referenceImages && referenceImages.length > 0) {
      console.log(`Injecting ${referenceImages.length} Visual Reference Images...`);

      parts.push({ 
        text: `\n\nCRITICAL VISUAL REFERENCES:\nThe following images are supplementary views (Side, Top, Detail) of the object to be preserved. Use them to understand the EXACT geometry, drain placement, and curves. Do not redesign the object; copy its structure from these references.` 
      });

      referenceImages.forEach((ref, index) => {
        // [FIX] Safety check to ensure we only send valid data
        if (ref && typeof ref === 'string' && ref.includes('base64,')) {
            const refBase64 = ref.replace(/^data:image\/[a-z]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: refBase64
              }
            });
        } else {
            console.warn(`Skipping invalid reference image at index ${index}`);
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
    console.log("Input Parts Count:", parts.length);
    console.log("Aspect Ratio:", imageConfig.aspectRatio || "Default");
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