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
  "Art Deco": "symmetrical layouts, bold geometric patterns, emerald or navy tiles, brushed gold hardware, fluted glass textures, tiered lighting, marble surfaces",
  "Biophilic": "living moss walls, pebble floor transitions, teak wood accents, oversized skylights, organic stone basins, abundant greenery, natural airiness",
  "Desert Modern": "warm terracotta tones, plaster tadelakt walls, matte black fixtures, arched entryways, dried pampas grass, natural sunlight, sandy textures",
  "Moody Luxe": "charcoal or obsidian stone, backlit mirrors, integrated LED strip lighting, dark wood cabinetry, chrome accents, hotel-spa atmosphere, high-contrast shadows",
  "Mediterranean": "hand-painted ceramic tiles, wrought iron details, terracotta floors, arched mirrors, lime-wash walls, weathered copper or bronze finishes, sun-drenched feel",
  "Zen Spa": "slatted wood partitions, river rocks, bamboo accents, steam atmosphere, floating vanity, soft diffused lighting, minimalist stone surfaces",
  "Mountain Modern": "slate stone, heavy timber beams, floor-to-ceiling glass, forest views, rustic textures, contemporary furniture, warm fireplace elements",
  "Soft Modern": "beige microcement, brushed nickel hardware, curved mirrors, neutral tones, warm ambient lighting, minimal but soft edges, plush textiles",
  "Modern Farmhouse": "high-contrast white walls, black window frames, marble countertops, X-motif cabinetry, shaker style doors, polished hardware, clean rustic blend",
  "Industrial Chic": "polished concrete, high-end glass partitions, black steel accents, plush white towels, refined utilitarian fixtures, open-plan layout, softened raw materials",
  "Dark Scandi": "smoked oak or walnut, deep sage or slate grey walls, minimalist functional furniture, hygge lighting, cozy textures, matte black accents",
  "Wabi-Sabi Japandi": "rough-hewn stone, textured plaster walls, irregular wooden stools, imperfect organic shapes, low furniture profiles, muted earthy tones",
  "Victorian": "ornate wainscoting, clawfoot tub, pedestal sink, floral wallpaper, intricate brass fixtures, dark mahogany wood, etched glass mirrors",
  "Hollywood Regency": "lacquered cabinets, mirrored surfaces, metallic gold accents, crystal chandeliers, high-gloss marble, black and white floor tiles, velvet stools",
  "French Country": "distressed wood beams, toile patterns, lavender accents, wrought iron towel racks, stone tile floors, soft cream palette, elegant curved cabinetry",
  "Brutalist": "heavy raw concrete, blocky geometric forms, rugged unpolished textures, matte metal fixtures, monochromatic grey tones, dramatic architectural shadows",
  "Tropical": "exotic mahogany wood, large palm leaf plants, outdoor-indoor transition, bamboo matting, turquoise accents, woven rattan textures, bright ventilation",
  "Southwestern": "terracotta clay tiles, sunset orange and pink hues, stucco walls, woven tribal rugs, turquoise stone accents, desert cacti, desert sun lighting",
  "Ultra-Minimalist": "handle-less cabinetry, hidden storage, monochrome white-on-white, large format porcelain slabs, frameless glass, zero visible hardware, clinical precision",
  "Grandmillennial": "chintz floral patterns, scalloped edges, antique porcelain accessories, wicker hampers, needlepoint textures, pastel palette, nostalgic 'granny-chic' charm",
  "Eclectic": "mix of vintage and modern periods, curated gallery wall, unexpected color pops, velvet mixed with metal, diverse textures, unique found objects",
  "Rustic": "unfinished log walls, natural stone boulders, warm leather accents, hand-forged copper basins, chunky wool textiles, warm amber lighting",
  "Neo-Classical": "Hellenic marble columns, symmetrical crown molding, muted gold leaf, cream and pale blue palette, dignified stone statues, formal elegance",
  "Memphis Design": "high-contrast primary colors, black zig-zag patterns, terrazzo countertops, whimsical geometric shapes, pop-art influence, matte plastic finishes",
  "Bauhaus": "form follows function, primary color accents, tubular steel frames, glass block walls, geometric purity, leather and chrome, functionalist lighting",
  "Retro Futurism": "chrome spheres, neon backlighting, space-age plastic curves, silver and metallic white, orbit-shaped mirrors, sleek synthetic surfaces",
  "Organic Modern": "sculptural driftwood, soft lime-plaster walls, linen curtains, pebble-shaped rugs, warm off-white palette, handcrafted ceramics, flowing lines",
  "Gothic Noir": "dark velvet drapes, pointed arch mirrors, wrought iron candelabras, heavy granite, deep burgundy tones, ornate wood carvings, mysterious shadows",
  "Shabby Chic": "distressed white-washed furniture, pastel floral motifs, ruffled linen towels, vintage crystal knobs, faded paint textures, romantic and airy aesthetic",
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
  // [NEW] Allow passing the editable description from UI
  customStyleDescription?: string; 
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