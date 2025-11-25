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

    // Map quality to resolution
    const resolutionMap: Record<string, string> = {
      "Standard": "1024x768",
      "High Fidelity (2K)": "2048x1536",
      "Ultra (4K)": "4096x3072"
    };
    
    // Map aspect ratio for generation config
    const aspectRatioMap: Record<string, string> = {
      "Original": "1:1",
      "16:9": "16:9",
      "1:1": "1:1",
      "4:3": "4:3"
    };

    const config: any = {
      responseModalities: [Modality.IMAGE],
    };

    // Build generationConfig with imageConfig
    const generationConfig: any = {
      imageConfig: {}
    };

    // Add resolution if quality is specified
    if (quality in resolutionMap) {
      const [width, height] = resolutionMap[quality].split("x").map(Number);
      generationConfig.imageConfig.outputPixelHeight = height;
      generationConfig.imageConfig.outputPixelWidth = width;
    }

    // Add aspect ratio if not original
    if (aspectRatio !== "Original" && aspectRatio in aspectRatioMap) {
      generationConfig.imageConfig.aspectRatio = aspectRatioMap[aspectRatio];
    }

    if (Object.keys(generationConfig.imageConfig).length > 0) {
      config.generationConfig = generationConfig;
    }

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

    const candidate = imageResponse.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

    if (!imagePart?.inlineData?.data) {
      throw new Error("No image data in Gemini response");
    }

    const mimeType = imagePart.inlineData.mimeType || "image/png";
    return `data:${mimeType};base64,${imagePart.inlineData.data}`;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Failed to generate room redesign: ${error instanceof Error ? error.message : String(error)}`);
  }
}
