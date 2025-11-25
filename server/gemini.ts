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

    // Map quality to base resolution (longest dimension)
    const qualityBaseResolutionMap: Record<string, number> = {
      "Standard": 1024,
      "High Fidelity (2K)": 2048,
      "Ultra (4K)": 4096
    };
    
    // Map aspect ratios to width:height ratio
    const aspectRatioMap: Record<string, [number, number]> = {
      "Original": [4, 3],  // Default to 4:3 for original
      "16:9": [16, 9],
      "1:1": [1, 1],
      "4:3": [4, 3]
    };

    const config: any = {
      responseModalities: [Modality.IMAGE],
    };

    // Build generationConfig with imageConfig
    const generationConfig: any = {
      imageConfig: {}
    };

    // Calculate resolution based on quality and aspect ratio
    if (quality in qualityBaseResolutionMap) {
      const baseResolution = qualityBaseResolutionMap[quality];
      const [ratioWidth, ratioHeight] = aspectRatioMap[aspectRatio] || [4, 3];
      
      // Calculate dimensions maintaining aspect ratio
      // Use baseResolution for the longer dimension
      let outputPixelWidth: number;
      let outputPixelHeight: number;
      
      if (ratioWidth >= ratioHeight) {
        // Width is longer or equal
        outputPixelWidth = baseResolution;
        outputPixelHeight = Math.round((baseResolution * ratioHeight) / ratioWidth);
      } else {
        // Height is longer
        outputPixelHeight = baseResolution;
        outputPixelWidth = Math.round((baseResolution * ratioWidth) / ratioHeight);
      }
      
      generationConfig.imageConfig.outputPixelHeight = outputPixelHeight;
      generationConfig.imageConfig.outputPixelWidth = outputPixelWidth;
    }

    // Set aspect ratio (for Gemini API, only set if not original)
    if (aspectRatio !== "Original" && aspectRatio in aspectRatioMap) {
      generationConfig.imageConfig.aspectRatio = aspectRatio;
    }

    if (Object.keys(generationConfig.imageConfig).length > 0) {
      config.generationConfig = generationConfig;
    }

    // Log the API request
    console.log("=== Gemini Image Generation API Request ===");
    console.log("Model: gemini-3-pro-image-preview");
    console.log("Prompt:", generationPrompt);
    console.log("Image data size:", base64Data.length, "bytes");
    console.log("Quality setting:", quality);
    console.log("Aspect Ratio setting:", aspectRatio);
    console.log("Generation Config:", JSON.stringify(config.generationConfig || {}, null, 2));
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
