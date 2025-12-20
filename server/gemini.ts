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

// [NEW] Helper to analyze the object for 3D reconstruction
export async function analyzeObjectStructure(imageBase64: string, objectName: string): Promise<string> {
  try {
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    console.log(`=== Analyzing 3D Structure for: ${objectName} ===`);

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Use Flash for fast text analysis
      contents: [
        {
          role: "user",
          parts: [
            { 
              text: `You are a 3D Modeler. Analyze the image and provide a technical description of the "${objectName}" to help a renderer reconstruct it from a DIFFERENT ANGLE.

              Describe these 3 aspects in concise bullet points:
              1. GEOMETRY: What is the basic shape? (e.g., cylindrical, rectangular with rounded edges).
              2. MATERIALS: What is the exact texture/finish? (e.g., brushed nickel, matte ceramic, oak wood grain).
              3. UNSEEN SIDES: Based on logic, describe what the back/side/top likely looks like. (e.g., "The side likely has a flat panel," "The top is open").` 
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ]
    });

    const description = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Analysis Result:", description.substring(0, 100) + "...");
    return description;
  } catch (error) {
    console.error("Analysis failed, skipping 3D context injection:", error);
    return ""; // Fail gracefully
  }
}

export async function generateRoomRedesign(params: RoomRedesignParams): Promise<string> {
  // Destructure 'creativityLevel'
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

    // Calculate Temperature
    // Gemini 3 Pro Image uses a temperature range of 0.0 to 2.0.
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

    if (aspectRatio !== "Original") {
      imageConfig.aspectRatio = aspectRatio;
    }

    if (Object.keys(imageConfig).length > 0) {
      config.imageConfig = imageConfig;
    }

    console.log("=== Gemini Image Generation API Request ===");
    console.log("Model: gemini-3-pro-image-preview");
    console.log("Prompt Length:", generationPrompt.length);
    console.log("Quality setting:", quality);
    console.log("Creativity Level:", creativityLevel, `(Temperature: ${temperature})`);
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
    }

    return `data:${mimeType};base64,${imageData}`;
  } catch (error) {
    console.error("=== Gemini API Error ===");
    console.error("Error details:", error);
    throw new Error(`Failed to generate room redesign: ${error instanceof Error ? error.message : String(error)}`);
  }
}