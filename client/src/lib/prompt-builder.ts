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
  addedElements?: string; 
  centerPreservedElements?: boolean;
  viewAngle?: string;
  cameraZoom?: number; // [NEW] Accept Zoom level
}

export function constructRoomScenePrompt(config: PromptConfig): string {
  // Destructure with default values
  const { 
    style, 
    preservedElements, 
    addedElements, 
    centerPreservedElements = true, 
    viewAngle = "Front (Original)",
    cameraZoom = 100 
  } = config;

  const specificAesthetic = styleDescriptions[style] || styleDescriptions["Scandinavian"];

  let prompt = `You are an expert interior designer and architectural visualizer.`;

  // === DYNAMIC ZOOM INSTRUCTIONS ===
  if (cameraZoom < 85) {
    prompt += `\n\nCRITICAL INSTRUCTION - WIDE ANGLE CONTEXT (Outpainting):
    The input image is centered with empty white space around it.
    Task: OUTPAINTING. You must fill the surrounding white space with a scene that perfectly matches the center image.
    Extend floors, ceilings, and walls seamlessly. Do NOT create a frame or border. The room continues deeply into the white space.`;
  } else if (cameraZoom > 115) {
    prompt += `\n\nCRITICAL INSTRUCTION - MACRO DETAIL (Upscaling):
    The input image is a zoomed-in crop.
    Task: UPSCALING & REFINEMENT. Focus on the texture and material quality of the visible objects.
    Do NOT add new objects that wouldn't be visible at this close range. Enhance the realism of existing surfaces.`;
  }

  // === PERSPECTIVE & ANGLE LOGIC ===
  if (viewAngle.includes("Side")) {
    prompt += `\n\nCRITICAL INSTRUCTION - PANORAMIC EXTENSION:
    The image has a gradient fade into white space on one side.
    Task: Seamlessly extend the room into that white space. 
    Do NOT create a divider, wall edge, or second room where the fade occurs. 
    The floor and ceiling lines must flow continuously from the image into the generated area.`;
  } else if (viewAngle === "Front (Original)" && cameraZoom >= 85 && cameraZoom <= 115) {
    // Only lock perspective if we aren't doing extreme zoom or angle changes
    prompt += `\n\nCRITICAL INSTRUCTION - PERSPECTIVE LOCK:
    Maintain the exact camera angle, field of view, and vanishing points of the original input image. The structural geometry (walls, ceiling, floor lines) must be preserved unless altered by the style change.`;
  }

  // === OBJECT PRESERVATION ===
  if (preservedElements && preservedElements.trim().length > 0) {
    prompt += `\n\nCRITICAL INSTRUCTION - OBJECT PRESERVATION:
    Strictly analyze the input image to identify the following elements: "${preservedElements}".`;

    if (viewAngle === "Front (Original)") {
      prompt += `\nYou must FREEZE the pixels associated with these specific elements. They must remain 100% UNCHANGED in geometry, texture, material, and position.`;
    } else {
      prompt += `\nMaintain the IDENTITY of these elements. While the perspective may shift slightly due to the new angle, the material, finish, and design must be identical to the original.`;
    }

    prompt += `\nDo not modify the structural shell of the room (walls, windows, ceiling) unless explicitly required by the style change.`;
  } else {
    prompt += `\n\nINSTRUCTION: Preserve the structural shell of the room (walls, floor, ceiling, windows) and perspective.`;
  }

  // === ADDED ELEMENTS ===
  if (addedElements && addedElements.trim().length > 0) {
    prompt += `\n\nCRITICAL INSTRUCTION - ADDED ELEMENTS:
    Seamlessly integrate the following elements into the scene: "${addedElements}".
    Ensure they are placed logically within the 3D space of the room (e.g., on the floor, tables, or walls as appropriate).
    The style, lighting, shadows, and perspective of these added elements must perfectly match the rest of the scene so they do not look pasted on.`;
  }

  prompt += `\n\nTRANSFORMATION GOAL:
  Redesign the rest of the room to match a "${style}" aesthetic.
  Key characteristics to apply: ${specificAesthetic}.
  Replace furniture, lighting, and decor that are NOT in the preservation list.`;

  // === FIXTURE COHERENCE ===
  if (preservedElements && preservedElements.trim().length > 0) {
    prompt += `\n\nCRITICAL INSTRUCTION - FIXTURE COHERENCE (MATCH PRESERVED ELEMENTS):
    You must explicitly analyze the material and metallic finish of the preserved "${preservedElements}".
    Use this existing finish (e.g., if the preserved item has chrome hinges, use chrome) as the 'Master Finish' for the rest of the room.
    Apply this exact matching finish to ALL NEW metallic fixtures (faucets, lighting, hardware) generated in the new design.`;
  } else {
    prompt += `\n\nCRITICAL INSTRUCTION - FIXTURE COHERENCE:
    For the selected style, choose the single most appropriate metallic finish (e.g., brushed nickel, matte black, chrome). You MUST apply this exact finish uniformly to **ALL** visible metallic fixtures, including plumbing hardware, lighting fixtures, and cabinet pulls. Maintain absolute consistency of this single finish across the entire scene.`;
  }

  prompt += `\n\nFINAL OUTPUT & COMPOSITION:
  Ensure lighting, shadows, and reflections blend realistically between the preserved elements and the new design.
  Generate a photorealistic result.`;

  if (centerPreservedElements && preservedElements && preservedElements.trim().length > 0 && viewAngle === "Front (Original)" && cameraZoom === 100) {
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