// Using user's own Google Gemini API key
import { GoogleGenAI, Modality } from "@google/genai";

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
}

export async function generateRoomRedesign(params: RoomRedesignParams): Promise<string> {
  const { imageBase64, customPrompt, quality, aspectRatio } = params;

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

    const mimeType = imagePart.inlineData.mimeType || "image/png";
    console.log("Generated image MIME type:", mimeType);
    console.log("Generated image size:", imagePart.inlineData.data.length, "bytes");
    
    return `data:${mimeType};base64,${imagePart.inlineData.data}`;
  } catch (error) {
    console.error("=== Gemini API Error ===");
    console.error("Error details:", error);
    console.error("========================");
    throw new Error(`Failed to generate room redesign: ${error instanceof Error ? error.message : String(error)}`);
  }
}
