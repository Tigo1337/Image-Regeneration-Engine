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
  productType?: string;
  productHeight?: string;
  productHeightPosition?: string; // [NEW]
  productWidth?: string;
  productWidthPosition?: string;  // [NEW]
  productDepth?: string;
  productDepthPosition?: string;  // [NEW]
  showTopLegend?: boolean;
  showBottomDisclaimer?: boolean;
}

export function constructDimensionalPrompt(config: PromptConfig): string {
  const { 
    productType, 
    productHeight, 
    productWidth, 
    productDepth,
    productHeightPosition = "Right",
    productWidthPosition = "Bottom",
    productDepthPosition = "Right",
    showTopLegend = true, 
    showBottomDisclaimer = true 
  } = config;

  // Helper text for placement
  const hPos = productHeightPosition.toUpperCase(); // LEFT or RIGHT
  const wPos = productWidthPosition.toUpperCase();  // TOP or BOTTOM
  const dPos = productDepthPosition.toUpperCase();  // LEFT or RIGHT

  let annotationLogic = "";

  // --- LOGIC CHANGE: We now ask for "Parallel" lines instead of Vertical/Horizontal ---

  if (productType === "Shower" || productType === "Tub Shower") {
    annotationLogic = `
  - HEIGHT: Draw a line PARALLEL to the vertical metal frame/wall channel. Placement: ${hPos} side. Label: '${productHeight}'.
  - WIDTH: Draw a line PARALLEL to the front threshold/base curb. Placement: ${wPos}. Label: '${productWidth}'.
  - DEPTH: Draw a line PARALLEL to the side return panel or wall. Placement: ${dPos} side. Label: '${productDepth}'.`;

  } else if (productType === "Shower Base") {
    annotationLogic = `
  - WIDTH: Draw a line PARALLEL to the front edge of the base. Placement: ${wPos}. Label: '${productWidth}'.
  - DEPTH: Draw a line PARALLEL to the side edge of the base. Placement: ${dPos}. Label: '${productDepth}'.
  - HEIGHT (LIP): Draw a small callout PARALLEL to the vertical corner of the threshold. Label: '${productHeight}'.`;

  } else {
    // Standard Bathtub / Vanity
    annotationLogic = `
  - HEIGHT: Draw a line PARALLEL to the vertical corner edge of the product. Placement: ${hPos} side. Label: '${productHeight}'.
  - WIDTH: Draw a line PARALLEL to the bottom edge of the product's front face. Placement: ${wPos}. Label: '${productWidth}'.
  - DEPTH: Draw a line PARALLEL to the edge of the product's side face. Placement: ${dPos} side. Label: '${productDepth}'.`;
  }

  return `Act as an expert Technical Illustrator and Image Editor.
  TASK: Add technical dimension lines to the EXISTING product image.

  1. CRITICAL: CANVAS LOCKING (DO NOT REGENERATE PRODUCT):
  - The input image is the "Background Layer". You must NOT modify, regenerate, or "improve" the product itself.
  - The bathtub/shower structure must remain PIXEL-PERFECT identical to the original.
  - You are only allowed to draw ON TOP of the image (Annotations Layer).

  2. PERSPECTIVE MATCHING (THE "PARALLEL" RULE):
  - Do NOT draw flat 2D lines. You must draw lines that exist in the 3D space of the photo.
  - **WIDTH LINE:** Must be perfectly PARALLEL to the bottom edge of the product. If the product is angled, the line must match that angle.
  - **DEPTH LINE:** Must follow the perspective lines (vanishing point) of the side of the product.
  - **HEIGHT LINE:** Must be parallel to the vertical corners of the product.

  3. DIMENSION VALUES & PLACEMENT:
  - Label Font: Arial, 12px, Black (#000000). No Bold.
  - Line Style: Solid Black (#000000), 1px thick.
  - Values to use:
    * HEIGHT: '${productHeight}' (Placed on ${hPos})
    * WIDTH: '${productWidth}' (Placed on ${wPos})
    * DEPTH: '${productDepth}' (Placed on ${dPos})

  4. EXECUTION STEPS:
  ${annotationLogic}

  5. COMPOSITION:
  - Output Aspect Ratio: 1:1 (Square).
  - If the original image is not square, add white padding to the edges. Do NOT stretch the product.
  - Padding: Keep all text at least 40px away from the outer edges.

  ${showTopLegend ? `
  6. LEGEND (Top-Right, 40px padding):
  - Text: 'Dimensions in inches (in.)'
  'Dimensions en pouces (po)'
  - Style: Arial, 12px, Black.` : ''}

  ${showBottomDisclaimer ? `
  7. DISCLAIMER (Bottom-Left, 40px padding):
  - Text: 'All dimensions are approximate. Structure measurements must be verified against the unit to ensure proper fit. Please see the detailed technical drawing for additional measurements.' 'Toutes ces dimensions sont approximatives. Afin d’assurer une installation parfaite, les dimensions de la structure doivent être vérifiées à partir de l’unité. Référez-vous au dessin technique pour les mesures supplémentaires.'
  - Style: Arial, 12px, Black.` : ''}
  
  8. NEGATIVE CONSTRAINTS (STRICT):
  - No colors other than #000000 (Black) and #FFFFFF (White Background).
  - No serif fonts (Times New Roman, etc.). Use Sans-Serif only.
  - No bold fonts.
  - No line weights other than 2px.
  - No text sizes other than 12px.
  - Do not change the camera angle or perspective of the product.
  - Do not duplicate the dimensions.
  - Do not write padding numbers (e.g. '40px') on the canvas.`;
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