export type PromptType = "room-scene";

export interface StyleDescription {
  name: string;
  description: string;
}

export const styleDescriptions: Record<string, string> = {
  "Scandinavian": "white walls, light wood tones (ash/birch), functional furniture, minimal decor, soft textiles, abundant natural light, and hygge elements",
  "Modern": "clean lines, minimal clutter, neutral color palette (white/grey/black), glass and steel accents, geometric shapes, raw concrete",
  "Contemporary": "current trends, rounded curves, soft textures, sophisticated and fluid shapes, organic elements, mixed metals, sculptural lighting",
  "Boho": "rattan, macramé, layered textiles, mismatched patterns, natural fibers (jute/wool), warm earth tones, abundant live plants, low-slung seating",
  "Industrial": "exposed brick, raw concrete floors, unfinished wood, black metal piping and fixtures, salvaged or utilitarian furniture, open-plan layout, visible ductwork",
  "Mid-Century Modern": "teak and walnut woods, tapered legs, geometric fabrics, bright accent colors (orange/teal/yellow), low profile furniture, iconic 1950s/60s pieces",
  "Farmhouse": "shiplap walls, reclaimed wood, large comfortable seating, galvanized metal accents, oversized lighting fixtures, white cabinets, wide-plank floors",
  "Coastal": "light blue and white color palette, linen and cotton fabrics, nautical accents (rope/driftwood), rattan and wicker furniture, slipcovered sofas, large windows, airy feel",
  "Transitional": "seamless blend of traditional and contemporary elements, curved and straight lines, neutral color palette (taupe/beige), emphasis on texture, lack of excessive ornamentation",
  "Japandi": "light natural wood (bamboo/ash), minimalist decor, clean lines (Japanese), soft textures (Scandinavian), wabi-sabi appreciation of imperfections, low furniture profiles",
  "Maximalist": "bold colors and patterns, layered textures (velvet, silk), gallery walls with excessive art, ornate details, saturated jewel tones (emerald, sapphire)",
};

export const availableStyles = Object.keys(styleDescriptions);

export interface PromptConfig {
  promptType: PromptType;
  style: string;
  preservedElements: string;
  centerPreservedElements?: boolean;
}

export function constructRoomScenePrompt(config: PromptConfig): string {
  const { style, preservedElements, centerPreservedElements = true } = config;

  const specificAesthetic = styleDescriptions[style] || styleDescriptions["Scandinavian"];

  let prompt = `You are an expert interior designer and architectural visualizer.`;

  prompt += `\n\nCRITICAL INSTRUCTION - PERSPECTIVE LOCK:
Maintain the exact camera angle, field of view, and vanishing points of the original input image. The structural geometry (walls, ceiling, floor lines) must be preserved unless altered by the style change.`;

  if (preservedElements && preservedElements.trim().length > 0) {
    prompt += `\n\nCRITICAL INSTRUCTION - OBJECT PRESERVATION:
Strictly analyze the input image to identify the following elements: "${preservedElements}".
You must FREEZE the pixels associated with these specific elements. They must remain 100% UNCHANGED in geometry, texture, material, and position.
Do not modify the structural shell of the room (walls, windows, ceiling) unless explicitly required by the style change.`;
  } else {
    prompt += `\n\nINSTRUCTION: Preserve the structural shell of the room (walls, floor, ceiling, windows) and perspective.`;
  }

  prompt += `\n\nTRANSFORMATION GOAL:
Redesign the rest of the room to match a "${style}" aesthetic.
Key characteristics to apply: ${specificAesthetic}.
Replace furniture, lighting, and decor that are NOT in the preservation list.`;

  prompt += `\n\nCRITICAL INSTRUCTION - FIXTURE COHERENCE:
For the selected style, choose the single most appropriate metallic finish (e.g., brushed nickel, matte black, chrome). You MUST apply this exact finish uniformly to **ALL** visible metallic fixtures, including preserved elements, plumbing hardware, lighting fixtures, and cabinet pulls. Maintain absolute consistency of this single finish across the entire scene.`;
  
  prompt += `\n\nFINAL OUTPUT & COMPOSITION:
Ensure lighting, shadows, and reflections blend realistically between the preserved elements and the new design.
Generate a photorealistic result.`;

  if (centerPreservedElements && preservedElements && preservedElements.trim().length > 0) {
    prompt += `\nIf the input image does not naturally center the MOST prominent item from "${preservedElements}", slightly reframe the generated output to place that item centrally within the new aspect ratio, while strictly adhering to the original camera angle and perspective.`;
  }

  return prompt;
}

export function constructPrompt(config: PromptConfig): string {
  switch (config.promptType) {
    case "room-scene":
      return constructRoomScenePrompt(config);
    default:
      return constructRoomScenePrompt(config);
  }
}

export const promptTypes: { value: PromptType; label: string; description: string }[] = [
  {
    value: "room-scene",
    label: "Room Scene",
    description: "Transform the room design while preserving specific elements",
  },
];
