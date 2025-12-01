// Using user's own Google Gemini API key
import { GoogleGenAI, Modality } from "@google/genai";
import sharp from "sharp";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

interface RoomRedesignParams {
  imageBase64: string;
  preservedElements: string;
  targetStyle: string;
  quality: string;
  aspectRatio: string;
  creativityLevel: number;
  customPrompt?: string;
  outputFormat?: string;
}

export async function generateRoomRedesign(params: RoomRedesignParams): Promise<string> {
  const { imageBase64, customPrompt, quality, aspectRatio, outputFormat = "PNG" } = params;

  try {
    // Use custom prompt if provided (user reviewed and edited)
    const generationPrompt = customPrompt || "Create a beautiful interior design image.";

    // Remove data URL prefix if present to get pure base64
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // Map quality to Gemini imageSize parameter
    const qualityToImageSizeMap: Record<string, string> = {
      "Standard": "1K",
      "High Fidelity (2K)": "2K",
      "Ultra (4K)": "4K"
    };

    // Map output format to MIME type
    const formatToMimeTypeMap: Record<string, string> = {
      "PNG": "image/png",
      "JPEG": "image/jpeg",
      "WebP": "image/webp"
    };

    const config: any = {
      responseModalities: [Modality.IMAGE],
    };

    // Build imageConfig directly in config (not nested under generationConfig)
    const imageConfig: any = {};

    // Set image size based on quality
    if (quality in qualityToImageSizeMap) {
      imageConfig.imageSize = qualityToImageSizeMap[quality];
    }

    // Set aspect ratio (for Gemini API, only set if not original)
    if (aspectRatio !== "Original") {
      imageConfig.aspectRatio = aspectRatio;
    }

    // Note: outputMimeType is not supported by Gemini API
    // We'll convert the image server-side to the requested format

    // Add imageConfig to main config if it has any settings
    if (Object.keys(imageConfig).length > 0) {
      config.imageConfig = imageConfig;
    }

    // Log the API request
    console.log("=== Gemini Image Generation API Request ===");
    console.log("Model: gemini-3-pro-image-preview");
    console.log("Prompt:", generationPrompt);
    console.log("Image data size:", base64Data.length, "bytes");
    console.log("Quality setting:", quality);
    console.log("Aspect Ratio setting:", aspectRatio);
    console.log("Output Format setting:", outputFormat);
    console.log("Config:", JSON.stringify(config, null, 2));
    console.log("==========================================");

    const imageResponse = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: generationPrompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ],
      config,
    });

    // Log response
    console.log("=== Gemini API Response ===");
    console.log("Response candidates count:", imageResponse.candidates?.length);
    const candidate = imageResponse.candidates?.[0];
    console.log("Candidate content parts:", candidate?.content?.parts?.length);
    console.log("============================");

    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

    if (!imagePart?.inlineData?.data) {
      throw new Error("No image data in Gemini response");
    }

    let imageData = imagePart.inlineData.data;
    let mimeType = imagePart.inlineData.mimeType || "image/png";
    console.log("Generated image MIME type (from Gemini):", mimeType);
    console.log("Generated image size (before conversion):", imageData.length, "bytes");
    
    // Convert image to requested format if different from what Gemini returned
    const targetMimeType = formatToMimeTypeMap[outputFormat];
    if (targetMimeType && mimeType !== targetMimeType) {
      console.log("Converting image from", mimeType, "to", targetMimeType);
      
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageData, 'base64');
      
      // Determine output format for Sharp
      let sharpFormat: keyof sharp.FormatEnum = 'png';
      if (outputFormat === 'JPEG') {
        sharpFormat = 'jpeg';
      } else if (outputFormat === 'WebP') {
        sharpFormat = 'webp';
      }
      
      // Convert the image
      const convertedBuffer = await sharp(imageBuffer).toFormat(sharpFormat).toBuffer();
      imageData = convertedBuffer.toString('base64');
      mimeType = targetMimeType;
      
      console.log("Image converted successfully");
      console.log("Generated image size (after conversion):", imageData.length, "bytes");
    }
    
    return `data:${mimeType};base64,${imageData}`;
  } catch (error) {
    console.error("=== Gemini API Error ===");
    console.error("Error details:", error);
    console.error("========================");
    throw new Error(`Failed to generate room redesign: ${error instanceof Error ? error.message : String(error)}`);
  }
}
