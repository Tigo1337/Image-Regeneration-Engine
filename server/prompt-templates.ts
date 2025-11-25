/**
 * System Prompt Templates for Room Redesign
 * Modify this file to adjust the prompt structure and logic
 */

export function getSystemInstruction(): string {
  return `You are an expert interior designer and architectural visualizer.
Using the attached image, generate a new room scene based on the user's request.`;
}

export function getImageAnalysisPrompt(preservedElements: string): string {
  return `You are an expert interior designer. Analyze this room image in detail and describe:
1. The overall room type (bedroom, living room, kitchen, bathroom, etc.)
2. Current style and color palette
3. Key architectural features (windows, doors, ceiling height, built-in elements)
4. Furniture and decor items present
5. Lighting and atmosphere
6. The specific elements the user wants to preserve: ${preservedElements}

Provide a comprehensive description focusing on spatial layout, materials, textures, and the exact location and appearance of preserved elements.`;
}

export function buildGenerationPrompt(
  roomAnalysis: string,
  preservedElements: string,
  targetStyle: string,
  quality: string,
  creativityLevel: number
): string {
  const systemInstruction = getSystemInstruction();

  const objectPreservation = `CRITICAL INSTRUCTION - OBJECT PRESERVATION:
Strictly analyze the input image to identify the following elements: "${preservedElements}".
You must FREEZE the pixels associated with these specific elements. They must remain 100% UNCHANGED in geometry, texture, material, and position.
Do not modify the structural shell of the room (walls, windows, ceiling) unless implied by the style change.`;

  const transformationGoal = `TRANSFORMATION GOAL:
Redesign the rest of the room to match a "${targetStyle}" aesthetic.
Quality Target: ${quality}.
Creativity Level: ${creativityLevel}%.`;

  const finalOutput = `FINAL OUTPUT:
Ensure lighting, shadows, and reflections blend realistically between the preserved elements and the new design.
Generate a photorealistic result with attention to detail, realistic textures, and professional interior design principles.`;

  return `${systemInstruction}

Room Analysis:
${roomAnalysis}

${objectPreservation}

${transformationGoal}

Style Guidelines for ${targetStyle}:
${getStyleGuidelines(targetStyle)}

${finalOutput}`;
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
