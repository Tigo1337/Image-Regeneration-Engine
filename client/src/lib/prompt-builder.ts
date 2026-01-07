export type PromptType = "room-scene" | "dimensional";

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
  cameraZoom?: number; 
  creativityLevel?: number;
  customStyleDescription?: string; 
  // [NEW] Dimensional Tool Fields
  productType?: string;
  productHeight?: string;
  productWidth?: string;
  productDepth?: string;
  showTopLegend?: boolean;
  showBottomDisclaimer?: boolean;
}

export function constructDimensionalPrompt(config: PromptConfig): string {
  const { 
    productType, 
    productHeight, 
    productWidth, 
    productDepth,
    showTopLegend = true, 
    showBottomDisclaimer = true 
  } = config;

  return `Act as an expert Image Compositor and Technical Editor. Do NOT act as a 3D renderer. 
Your goal is to add technical annotations to the attached image while preserving the original product photography exactly.

1. DIMENSION VALUES (CRITICAL - STRICT ADHERENCE):
- You MUST use the exact text strings provided below. Do NOT add, remove, or convert units (", in, mm).
- Use EXACTLY these labels:
  * HEIGHT LABEL: '${productHeight}'
  * WIDTH LABEL: '${productWidth}'
  * DEPTH LABEL: '${productDepth}'

2. IMAGE PRESERVATION & COMPOSITION:
- Pixel Freeze: Strictly preserve the angle, perspective, lighting, and texture of the original product. Do not re-render.
- Target Size: The product should occupy exactly 60% of the vertical space of the final image.
- Outpainting: Zoom Out by adding a wide, seamless white border. The final output must be 1:1 (Square).

3. SPATIAL ANALYSIS & PADDING:
- Identify the 3D bounding box of the product. 
- Dimension lines must be 'offset' (distanced) from the product by roughly 10% of the product's width.
- Ensure all lines follow the vanishing points/perspective of the original photo.
- PADDING RULE: All corner text (Legend/Disclaimer) MUST be placed exactly 40 pixels from the canvas edges.

4. ANNOTATION PLACEMENT:
${productType === "Shower Unit" ? `
- HEIGHT: Draw a vertical line matching the total vertical bounds. Label: '${productHeight}'.
- WIDTH: Draw a horizontal line across the front threshold. Label: '${productWidth}'.
- DEPTH: Draw a line along the side profile following perspective. Label: '${productDepth}'.` : `
- WIDTH: Draw a line across the longest horizontal footprint edge. Label: '${productWidth}'.
- DEPTH: Draw a line along the perpendicular horizontal footprint edge. Label: '${productDepth}'.
- HEIGHT (LIP): Draw a small vertical callout line at the front threshold/lip. Label: '${productHeight}'.`}

${showTopLegend ? `
5. TOP LEGEND (Fixed Layout):
- Text: 'Dimensions in inches (in.)' / 'Dimensions en pouces (po)'
- Position: Top-Right corner (Exactly 40 pixels padding from Top and Right edges).` : ''}

${showBottomDisclaimer ? `
6. BOTTOM DISCLAIMER (Fixed Layout):
- Text: 'All dimensions are approximate. Structure measurements must be verified against the unit to ensure proper fit. Please see the detailed technical drawing for additional measurements.' / 'Toutes ces dimensions sont approximatives. Afin d’assurer une installation parfaite, les dimensions de la structure doivent être vérifiées à partir de l’unité. Référez-vous au dessin technique pour les mesures supplémentaires.'
- Position: Bottom-Left corner (Exactly 40 pixels padding from Bottom and Left edges).` : ''}

7. NEGATIVE CONSTRAINTS:
- No bold fonts.
- Do not change camera angle.
- Do not write margin numbers (e.g., '40px') on the canvas.`;
}

export function constructRoomScenePrompt(config: PromptConfig): string {
  // Destructure with default values
  const { 
    style, 
    preservedElements, 
    addedElements, 
    centerPreservedElements = true, 
    viewAngle = "Original",
    cameraZoom = 100,
    creativityLevel = 50,
    customStyleDescription // [NEW]
  } = config;

  // Use the custom description if provided, otherwise fallback to the dictionary
  const specificAesthetic = customStyleDescription || styleDescriptions[style] || styleDescriptions["Scandinavian"];

  // Creativity applies to the ROOM SHELL, not the preserved object identity.
  const isHighCreativity = creativityLevel >= 70;

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
  if (viewAngle === "Original") {
      prompt += `\n\nCRITICAL INSTRUCTION - PERSPECTIVE LOCK:
      Maintain the EXACT camera angle and perspective of the original input image. 
      The preserved object must be viewed from the exact same vantage point as the original.`;
  } else {
      // Forcing a new angle
      prompt += `\n\nCRITICAL INSTRUCTION - CHANGE CAMERA ANGLE:
      You must re-render the scene from a strictly "${viewAngle}" perspective.`;

      if (viewAngle === "Front") {
        prompt += `\n**CAMERA LOCK: 0-DEGREE FRONT ELEVATION**`;
        prompt += `\n1. Position the camera directly perpendicular to the face of the "${preservedElements}".`;
        prompt += `\n2. Use One-Point Perspective: All horizontal lines of the object must be perfectly parallel to the image frame.`;
        prompt += `\n3. Do not show the side panels of the object. Show ONLY the front face.`;
      }

      if (viewAngle === "Side") {
        prompt += `\n**CAMERA LOCK: 45-DEGREE ISOMETRIC / THREE-QUARTER VIEW**`;
        prompt += `\n1. Rotate the camera strictly 45 degrees around the "${preservedElements}".`;
        prompt += `\n2. COMPOSITION RULE: You MUST show two distinct faces of the object (the Front Face AND the Side Face) to establish volumetric depth.`;
        prompt += `\n3. The object should NOT look flat. It must have 3D dimensionality.`;
      }

      if (viewAngle === "Top") {
        prompt += `\n**CAMERA LOCK: 90-DEGREE OVERHEAD (FLAT LAY)**`;
        prompt += `\nOrient the view to be a Top-Down / Flat-Lay view, looking directly down at the "${preservedElements}".`;
        prompt += `\n**TOP VIEW CONSTRAINT**: You must respect the object's asymmetry. If the drain/faucets are offset in the 3D structure, they MUST be offset in the top view. Do NOT auto-center internal features.`;
      }
  }

  // === OBJECT PRESERVATION ===
  if (preservedElements && preservedElements.trim().length > 0) {
    prompt += `\n\nCRITICAL INSTRUCTION - OBJECT PRESERVATION:
    Strictly analyze the input image to identify the following elements: "${preservedElements}".`;

    if (viewAngle === "Original") {
      // IF ANGLE IS ORIGINAL: We can visually freeze pixels
      if (centerPreservedElements) {
         prompt += `\n1. VISUAL FREEZE: You must FREEZE the visual appearance (geometry, texture, material, details) of the "${preservedElements}". It must look EXACTLY like the original.`;
         prompt += `\n2. PERMISSION TO MOVE: You are explicitly permitted to SHIFT THE POSITION (X/Y axis) of this element on the canvas to center it within the new aspect ratio.`;
         prompt += `\n3. RESTRICTION: Do NOT rotate, scale, or distort the object itself. Only its placement on the canvas may change.`;
      } else {
         prompt += `\nYou must FREEZE the pixels associated with these specific elements. They must remain 100% UNCHANGED in geometry, texture, material, and position.`;
      }
    } else {
      // IF ANGLE IS CHANGED: We cannot freeze pixels, must preserve Identity
      prompt += `\n1. IDENTITY PRESERVATION: Since the camera angle is changing to "${viewAngle}", you cannot freeze the pixels. Instead, you must generate a perfect 3D representation of the "${preservedElements}" from this new angle.`;
      prompt += `\n2. DESIGN CONSISTENCY: The object must have the EXACT SAME design, material, finish, and features as the original. It should look like the same physical object, just viewed from the ${viewAngle}.`;
      prompt += `\n3. INTERNAL GEOMETRY: Pay close attention to internal curves, drain placement, and rim width. These must match the original object's technical specifications.`;
    }

    // ROOM STRUCTURE LOGIC
    if (!isHighCreativity) {
      prompt += `\n\nCONSTRAINT - ROOM STRUCTURE:
      Do not modify the structural shell of the room (walls, windows, ceiling) unless explicitly required by the style change. Keep the room layout identical.`;
    } else {
      prompt += `\n\nFREEDOM - ROOM STRUCTURE:
      You have creative freedom to redesign the structural shell (walls, floor, ceiling, windows) surrounding the preserved object. You may change the room's architecture to perfectly match the "${style}" aesthetic, provided the preserved object remains intact.`;
    }

  } else {
    // If nothing preserved
    if (!isHighCreativity && viewAngle === "Original") {
      prompt += `\n\nINSTRUCTION: Preserve the structural shell of the room (walls, floor, ceiling, windows) and perspective.`;
    }
  }

  // === ADDED ELEMENTS ===
  if (addedElements && addedElements.trim().length > 0) {
    prompt += `\n\nCRITICAL INSTRUCTION - ADDED ELEMENTS:
    Seamlessly integrate the following elements into the scene: "${addedElements}".
    Ensure they are placed logically within the 3D space of the room.`;
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

  return prompt;
}

export function constructPrompt(config: PromptConfig): string {
  switch (config.promptType) {
    case "dimensional":
      return constructDimensionalPrompt(config);
    case "room-scene":
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
  {
    value: "dimensional",
    label: "Dimensional Image",
    description: "Add technical dimension annotations to a product image",
  }
];