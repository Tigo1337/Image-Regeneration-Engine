// Using Replit AI Integrations for Gemini - blueprint:javascript_gemini_ai_integrations
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

interface RoomRedesignParams {
  imageBase64: string;
  preservedElements: string;
  targetStyle: string;
  quality: string;
  creativityLevel: number;
}

export async function generateRoomRedesign(params: RoomRedesignParams): Promise<string> {
  const { imageBase64, preservedElements, targetStyle, quality, creativityLevel } = params;

  // Remove data URL prefix if present to get pure base64
  const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  try {
    // Step 1: Analyze the original room image with Gemini Flash (vision)
    const analysisPrompt = `You are an expert interior designer. Analyze this room image in detail and describe:
1. The overall room type (bedroom, living room, kitchen, bathroom, etc.)
2. Current style and color palette
3. Key architectural features (windows, doors, ceiling height, built-in elements)
4. Furniture and decor items present
5. Lighting and atmosphere
6. The specific elements the user wants to preserve: ${preservedElements}

Provide a comprehensive description focusing on spatial layout, materials, textures, and the exact location and appearance of preserved elements.`;

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: analysisPrompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ],
    });

    const roomAnalysis = analysisResponse.text || "A well-lit interior room";

    // Step 2: Generate a new room design using image generation model
    const generationPrompt = `Create a photorealistic interior design image based on this description:

${roomAnalysis}

DESIGN REQUIREMENTS:
- Transform the space to ${targetStyle} style
- Quality level: ${quality} with exceptional attention to detail
- Creativity/transformation level: ${creativityLevel}% (${creativityLevel < 30 ? 'subtle changes' : creativityLevel < 70 ? 'moderate redesign' : 'dramatic transformation'})
- CRITICAL: Keep these elements EXACTLY as they appear in the original: ${preservedElements}
- Maintain the same room type, dimensions, and architectural shell
- Ensure realistic lighting, shadows, and reflections
- Use professional interior photography composition

Style guidelines for ${targetStyle}:
${getStyleGuidelines(targetStyle)}

Generate a stunning, magazine-quality interior design photograph.`;

    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
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

function getStyleGuidelines(style: string): string {
  const guidelines: Record<string, string> = {
    "Modern": "Clean lines, minimalist furniture, neutral colors (white, gray, black), sleek surfaces, hidden storage, large windows, minimal decoration, contemporary materials like glass and metal",
    "Contemporary": "Current design trends, mix of textures, bold accent colors, artistic pieces, comfortable seating, statement lighting, open layouts, blend of modern and traditional",
    "Boho": "Eclectic mix, warm earthy tones, natural materials (rattan, jute, wood), layered textiles, plants, vintage pieces, macramé, colorful patterns, relaxed vibe, global influences",
    "Industrial": "Exposed brick or concrete, metal fixtures, Edison bulbs, raw wood, open ductwork, neutral color palette with metal accents, leather furniture, reclaimed materials, urban loft aesthetic",
    "Scandinavian": "Light, airy spaces, white walls, natural wood, simple lines, functional furniture, cozy textiles (wool, sheepskin), minimal clutter, hygge atmosphere, pops of black, plants",
    "Mid-Century Modern": "Organic curves, tapered legs, teak or walnut wood, bold geometric patterns, retro colors (mustard, olive, orange), statement pieces, functional design, atomic age influence, clean lines"
  };
  
  return guidelines[style] || "Clean, well-designed interior space with attention to detail and cohesive aesthetic";
}
