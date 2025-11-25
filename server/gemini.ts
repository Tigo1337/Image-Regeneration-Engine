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

export async function buildGenerationPrompt(roomAnalysis: string, params: RoomRedesignParams): Promise<string> {
  const { preservedElements, targetStyle, quality, creativityLevel } = params;
  
  return `Create a photorealistic interior design image based on this description:

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
