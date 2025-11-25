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
  creativityLevel: number;
  customPrompt?: string;
}

export async function generateRoomRedesign(params: RoomRedesignParams): Promise<string> {
  const { customPrompt } = params;

  try {
    // Use custom prompt if provided (user reviewed and edited)
    const generationPrompt = customPrompt || "Create a beautiful interior design image.";

    const imageResponse = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [{ role: "user", parts: [{ text: generationPrompt }] }],
      config: {
        responseModalities: [Modality.IMAGE],
      },
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
