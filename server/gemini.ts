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
  // [CRITICAL FIX] Destructure 'creativityLevel' so it can be used
  const { imageBase64, customPrompt, quality, aspectRatio, creativityLevel, outputFormat = "PNG" } = params;

  try {
    const generationPrompt = customPrompt || "Create a beautiful interior design image.";
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

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

    // [CRITICAL FIX] Calculate Temperature
    // Gemini 3 Pro Image uses a temperature range of 0.0 to 2.0.
    // Default to 1.0 (50% creativity) if undefined.
    const temperature = typeof creativityLevel === 'number' 
      ? (creativityLevel / 100) * 2.0 
      : 1.0;

    const config: any = {
      responseModalities: [Modality.IMAGE],
      // [CRITICAL FIX] Pass the calculated temperature to the model
      temperature: temperature, 
    };

    const imageConfig: any = {};

    if (quality in qualityToImageSizeMap) {
      imageConfig.imageSize = qualityToImageSizeMap[quality];
    }

    if (aspectRatio !== "Original") {
      imageConfig.aspectRatio = aspectRatio;
    }

    if (Object.keys(imageConfig).length > 0) {
      config.imageConfig = imageConfig;
    }

    console.log("=== Gemini Image Generation API Request ===");
    console.log("Model: gemini-3-pro-image-preview");
    console.log("Prompt:", generationPrompt);
    console.log("Image data size:", base64Data.length, "bytes");
    console.log("Quality setting:", quality);
    // Log temperature to verify it's working
    console.log("Creativity Level:", creativityLevel, `(Temperature: ${temperature})`);
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

    // Convert image to requested format if different from what Gemini returned
    const targetMimeType = formatToMimeTypeMap[outputFormat];
    if (targetMimeType && mimeType !== targetMimeType) {
      console.log("Converting image from", mimeType, "to", targetMimeType);

      const imageBuffer = Buffer.from(imageData, 'base64');

      let sharpFormat: keyof sharp.FormatEnum = 'png';
      if (outputFormat === 'JPEG') {
        sharpFormat = 'jpeg';
      } else if (outputFormat === 'WebP') {
        sharpFormat = 'webp';
      }

      const convertedBuffer = await sharp(imageBuffer).toFormat(sharpFormat).toBuffer();
      imageData = convertedBuffer.toString('base64');
      mimeType = targetMimeType;

      console.log("Image converted successfully");
    }

    return `data:${mimeType};base64,${imageData}`;
  } catch (error) {
    console.error("=== Gemini API Error ===");
    console.error("Error details:", error);
    throw new Error(`Failed to generate room redesign: ${error instanceof Error ? error.message : String(error)}`);
  }
}