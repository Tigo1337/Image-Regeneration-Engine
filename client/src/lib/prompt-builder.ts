export type PromptType = "room-scene";

export interface StyleDescription {
  name: string;
  description: string;
}

export const styleDescriptions: Record<string, string> = {
  "Scandinavian": "Focus on high-contrast textures over color. Utilize a 'Hygge' atmosphere with a mix of matte light woods, tactile wool fabrics, and soft ambient natural light. The palette should be monochromatic but rich in material variety",
  "Modern": "A study in 'Less is More' through geometric discipline. Emphasize large-scale unadorned surfaces, the interplay of shadow and light on flat planes, and a sophisticated mix of cold metals (steel/chrome) against warm natural stone",
  "Contemporary": "A fluid aesthetic defined by soft-touch finishes and organic curves. Balance high-gloss surfaces with deep-pile textiles. Focus on the interplay of mixed metals and sculptural, diffused lighting that highlights rounded architectural forms",
  "Boho": "A 'Collected, Not Decorated' aesthetic. Lean into an organic, maximalist-light approach using highly varied natural textures like woven seagrass, raw terracotta, and layered patterned textiles. Lighting should feel warm and sun-drenched",
  "Industrial": "Emphasize the beauty of raw, 'unfinished' materials. Contrast the cold, hard texture of polished concrete and black iron piping with the warmth of deep-grained reclaimed wood and exposed, patinated brickwork",
  "Mid-Century Modern": "Highlight the contrast between organic wood grains (teak/walnut) and smooth synthetic polymers. Focus on low-profile geometry, matte-finish cabinetry, and punctuated pops of saturated primary colors through textile and glass",
  "Farmhouse": "Defined by 'Worn-In' comfort. Prioritize matte, chalky paint finishes, wide-planked distressed wood, and tactile fabrics like linen and burlap. Use galvanized metals and oversized fixtures to create a sense of scale",
  "Coastal": "Capture the essence of air and light. Use a palette of bleached woods, crisp cottons, and weathered driftwood textures. Lighting should be bright and overexposed, mimicking a reflective seaside atmosphere",
  "Transitional": "A sophisticated equilibrium between heritage and modernism. Blend the tactile weight of traditional crown molding with the sleek, neutral surfaces of contemporary design. Focus on taupe and beige tonality with rich fabric layering",
  "Japandi": "The intersection of Scandi-function and Japanese wabi-sabi. Use light-toned bamboo, slatted wood partitions, and stone surfaces with natural imperfections. Keep lines horizontal and low, emphasizing quietude and matte finishes",
  "Maximalist": "A high-drama celebration of saturated jewel tones and tactile abundance. Layer velvet, silk, and brocade against ornate gold details. Focus on rhythmic patterns and the complex interplay of shadows in a heavily curated space",
  "Art Deco": "Architectural glamour defined by 'The Machine Age.' Prioritize polished marble, brushed gold hardware, and fluted glass textures. Use high-contrast symmetry and tiered lighting to create a sense of verticality and opulence",
  "Biophilic": "Blur the line between interior and exterior. Integrate living moss textures, river-stone transitions, and raw teak. Focus on abundant, unfiltered natural light and the moisture-rich atmosphere of a greenhouse",
  "Desert Modern": "Inspired by arid landscapes. Use sun-baked terracotta, plaster tadelakt walls, and sandy, abrasive textures. Contrast these with matte black fixtures and sharp, dramatic architectural shadows from the high sun",
  "Moody Luxe": "A 'Hotel-Spa' atmosphere defined by obsidian stone and charcoal wood. Use backlit surfaces and integrated LED strips to create high-contrast highlights on dark, velvet-smooth cabinetry and chrome accents",
  "Mediterranean": "Sun-drenched and earthy. Focus on hand-painted ceramic glaze, lime-washed plaster walls, and weathered bronze. The flooring should feel cool to the touch with terracotta or stone tiles under a warm, golden light",
  "Zen Spa": "The ultimate in sensory reduction. Use slatted wood partitions to create rhythmic shadows, smooth river rocks, and floating stone vanities. Lighting must be soft, diffused, and indirect to mimic a steam-filled sanctuary",
  "Mountain Modern": "Rugged gravity meets clean lines. Utilize heavy timber beams with visible grain, slate stone flooring, and floor-to-ceiling glass. The materiality should feel defensive against the elements but plush and warm internally",
  "Soft Modern": "A gentler take on minimalism. Focus on beige microcement, brushed nickel, and radius (curved) edges. The atmosphere should feel 'hush-toned' with neutral palettes and plush, enveloping textiles",
  "Modern Farmhouse": "High-contrast architectural clarity. Combine the sharpness of black steel window frames with the soft, organic texture of white marble and shaker-style cabinetry. Focus on clean lines and polished hardware",
  "Industrial Chic": "A refined take on raw materials. Pair polished, high-gloss concrete with sophisticated glass partitions. Use black steel for structural accents but soften the atmosphere with high-thread-count white textiles",
  "Dark Scandi": "The 'Noir' side of Hygge. Utilize smoked oak or walnut, deep slate-grey matte walls, and cozy, heavy-knit textures. Focus on low-level 'pools' of warm light against dark, minimalist functionalism",
  "Wabi-Sabi Japandi": "Appreciate the beauty of the aged and irregular. Use rough-hewn stone, textured lime plaster, and irregular wooden forms. The palette should be muted and earthy, emphasizing the 'honesty' of raw materials",
  "Victorian": "Ornate materiality and historical weight. Focus on intricate wood carvings, heavy brass patina, and etched glass. Use deep, saturated tones like mahogany and emerald, highlighted by the flickering quality of candlelight",
  "Hollywood Regency": "Cinematic glamour. Use high-gloss lacquered surfaces, mirrored furniture, and metallic gold accents. The atmosphere should be theatrical, featuring high-contrast black-and-white floors and velvet-clad focal points",
  "French Country": "Elegant rusticity. Combine distressed white-washed wood with soft lavender or cream palettes. Focus on curved cabinetry, wrought iron details, and the tactile quality of stone tile and toile fabrics",
  "Brutalist": "Monolithic and raw. Emphasize the massive weight of unpolished concrete and blocky geometric forms. Use monochromatic grey tones and dramatic architectural shadows to highlight the rugged, honest texture of the build",
  "Tropical": "Exotic and ventilated. Use dark mahogany, woven rattan, and large-scale leafy greenery. Focus on the transition between indoor stone floors and outdoor bamboo textures, with turquoise accents mimicking water",
  "Southwestern": "Adobe-inspired textures. Use sunset hues (pink, orange, clay) against stucco walls. Prioritize the woven texture of tribal rugs and the cool, matte touch of turquoise stone and terracotta clay tiles",
  "Ultra-Minimalist": "Clinical precision and zero visual noise. Use large-format porcelain slabs, handle-less cabinetry, and frameless glass. Everything is hidden; focus on the perfection of the white-on-white material joinery",
  "Grandmillennial": "Nostalgic and layered. Use chintz florals, scalloped wicker, and needlepoint textures. The palette is a mix of pastels and 'heirloom' wood finishes, creating a cozy, storied, and slightly eccentric atmosphere",
  "Eclectic": "A curation of historical layers. Mix matte vintage woods with high-gloss modern metals. Focus on the harmony found in diversity—pairing unexpected color pops with a variety of textures like velvet, leather, and glass",
  "Rustic": "The raw power of nature. Use unfinished log walls, massive stone boulders, and hand-forged copper. The atmosphere is defined by the smell and feel of leather, chunky wool, and warm amber lighting",
  "Neo-Classical": "Formal, dignified elegance. Use Hellenic marble columns, muted gold leaf, and symmetrical crown moldings. Focus on the cool, smooth touch of stone statues against cream-colored silk-finish walls",
  "Memphis Design": "A playful, pop-art rebellion. Use high-contrast primary colors, black-and-white zig-zag patterns, and terrazzo surfaces. Focus on whimsical geometric forms and matte plastic or laminate finishes",
  "Bauhaus": "Industrial functionalism. Use tubular steel frames, glass block walls, and primary color accents. The materiality is a mix of leather, chrome, and smooth geometric purity where 'form follows function'",
  "Retro Futurism": "The 'Space Age' imagined from the past. Use chrome spheres, neon backlighting, and sleek synthetic curves. Focus on silver and metallic white surfaces that feel like a polished spaceship interior",
  "Organic Modern": "Sculptural and grounded. Use soft lime-plaster walls, driftwood accents, and linen curtains. Focus on 'pebble' shapes—smooth, rounded, and handcrafted—in a warm, off-white earth-toned palette",
  "Gothic Noir": "Mysterious and heavy. Use dark velvet drapes, wrought iron candelabras, and deep burgundy granite. Emphasize pointed arches and the intricate, dark-stained grain of carved wood",
  "Shabby Chic": "Romantic, airy, and time-worn. Use distressed, white-washed furniture with faded paint textures. Focus on ruffled linens, vintage crystal, and a soft pastel palette that feels lived-in and nostalgic",
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
}

export function constructRoomScenePrompt(config: PromptConfig): string {
  const { 
    style, 
    preservedElements, 
    addedElements, 
    centerPreservedElements = true, 
    viewAngle = "Original",
    cameraZoom = 100,
    creativityLevel = 50,
    customStyleDescription 
  } = config;

  const specificAesthetic = customStyleDescription || styleDescriptions[style] || styleDescriptions["Scandinavian"];
  const isHighCreativity = creativityLevel >= 70;

  // === [NEW] POINT #2: STYLE VARIANCE LOGIC ===
  let styleGuidance = "";
  if (creativityLevel < 30) {
      styleGuidance = `Follow the ${style} aesthetic with clinical, textbook precision. Use only the most iconic elements.`;
  } else if (creativityLevel < 70) {
      styleGuidance = `Provide a standard, balanced interpretation of the ${style} aesthetic, focusing on cohesive materials.`;
  } else {
      styleGuidance = `Provide a unique, 'Designer Signature' take on ${style}. Introduce unexpected but complementary textures and avant-garde lighting that push the boundaries of the style.`;
  }

  let prompt = `You are an expert interior designer and architectural visualizer. Use a high-end architectural photography style.`;

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
      prompt += `\n\nCRITICAL INSTRUCTION - GEOMETRIC PERSPECTIVE LOCK:
      1. HORIZON LINE: Maintain the EXACT vertical position of the horizon line from the original input image.
      2. VANISHING POINTS: Do not shift the vanishing points. All orthogonal lines in the new environment must converge at the exact same coordinates as the original image.
      3. FOCAL LENGTH: Do not change the lens distortion. If the original is a wide-angle, the output must remain wide-angle.
      4. VANTAGE POINT: The camera height, tilt, and pan must remain at 0% deviation from the original source. The preserved object must be viewed from the exact same vantage point.`;
  } else {
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
      if (centerPreservedElements) {
         prompt += `\n1. VISUAL FREEZE: You must FREEZE the visual appearance (geometry, texture, material, details) of the "${preservedElements}". It must look EXACTLY like the original.`;
         prompt += `\n2. PERMISSION TO MOVE: You are explicitly permitted to SHIFT THE POSITION (X/Y axis) of this element on the canvas to center it within the new aspect ratio.`;
         prompt += `\n3. RESTRICTION: Do NOT rotate, scale, or distort the object itself. Only its placement on the canvas may change.`;
         prompt += `\n4. SPATIAL ANCHOR: Use the 3D orientation of the "${preservedElements}" as the master coordinate system for the entire room.`;
      } else {
         prompt += `\nYou must FREEZE the pixels associated with these specific elements. They must remain 100% UNCHANGED in geometry, texture, material, and position.`;
      }
    } else {
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

  // === [NEW] POINT #3: MATERIALITY FOCUS & TRANSFORMATION ===
  prompt += `\n\nTRANSFORMATION GOAL:
  Redesign the environment to match a "${style}" aesthetic.
  STYLE DIRECTION: ${styleGuidance}
  KEY CHARACTERISTICS: ${specificAesthetic}.

  MATERIALITY DIRECTIVE: 
  Interpret the style primarily through material depth and surface quality. Focus on how light interacts with different textures (e.g., the grain of wood, the coolness of stone, the softness of textiles). Avoid generic surfaces; prioritize tactile realism.
  Replace furniture, lighting, and decor that are NOT in the preservation list to align with this vision.`;

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