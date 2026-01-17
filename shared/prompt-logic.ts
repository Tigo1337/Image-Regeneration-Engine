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
  centerPreservedElements?: boolean;
  viewAngle?: string;
  cameraZoom?: number; 
  creativityLevel?: number; // Now 1, 2, 3, or 4
  customStyleDescription?: string; 
}

export function constructRoomScenePrompt(config: PromptConfig): string {
  const { 
    style, 
    preservedElements, 
    viewAngle = "Original",
    cameraZoom = 100,
    creativityLevel = 2,
    customStyleDescription 
  } = config;

  const specificAesthetic = customStyleDescription || styleDescriptions[style] || styleDescriptions["Scandinavian"];

  // 4-TIER CREATIVITY LOGIC (Complexity Slider)
  const isAestheticRefresh = creativityLevel === 1;   // Tier 1: Surface only
  const isSurfaceRenovation = creativityLevel === 2;  // Tier 2: Decorative additions
  const isArchitecturalRemodel = creativityLevel === 3; // Tier 3: Shell geometry changes
  const isMetamorphosis = creativityLevel === 4;      // Tier 4: Total deconstruction

  let styleGuidance = "";
  if (isAestheticRefresh) {
      styleGuidance = `Follow the ${style} aesthetic with clinical, textbook precision. Maintain a 'Restoration' mindset.`;
  } else if (isSurfaceRenovation) {
      styleGuidance = `Provide a standard, balanced interpretation of the ${style} aesthetic, focusing on cohesive materials and professional propping.`;
  } else if (isArchitecturalRemodel) {
      styleGuidance = `Execute a high-end designer remodel of ${style}. Introduce sophisticated architectural textures and professional lighting.`;
  } else {
      styleGuidance = `Execute a 'Mandatory Architectural Metamorphosis.' Provide a unique, avant-garde 'Designer Signature' take on ${style} focusing on structural geometry.`;
  }

  // PHASE 1: ROLE & GLOBAL QUALITY
  let prompt = `You are an expert interior designer and architectural visualizer. Use a high-end architectural photography style.`;

  // PHASE 2: CANVAS & ZOOM
  if (cameraZoom < 85) {
      prompt += `\n\nCRITICAL INSTRUCTION - WIDE ANGLE CONTEXT (Outpainting):
      The input image is centered with empty white space around it.
      Task: OUTPAINTING. Fill the surrounding white space with a scene that perfectly matches the center image.
      Extend floors, ceilings, and walls seamlessly. Maintain uniform lighting; avoid vignetting or artificial shadows at the edges.`;
  } else if (cameraZoom > 115) {
      prompt += `\n\nCRITICAL INSTRUCTION - MACRO DETAIL (Upscaling):
      The input image is a zoomed-in crop. Focus on texture and material quality.
      Enhance the realism of existing surfaces without adding new large-scale objects.`;
  }

  // PHASE 3: PERSPECTIVE & CAMERA MATH (Strictly locked to Original)
  prompt += `\n\nCRITICAL INSTRUCTION - GEOMETRIC PERSPECTIVE LOCK:
  1. HORIZON LINE: Maintain the EXACT vertical position of the horizon line from the original input image.
  2. VANISHING POINTS: All orthogonal lines in the new environment must converge at the exact same coordinates as the original image. Zero perspective deviation.
  3. VANTAGE POINT: The camera height, tilt, and pan must remain at 0% deviation. The camera lens and position must remain static and fixed.`;

  // PHASE 4: OBJECT ANCHORING & DYNAMIC STAGING
  if (preservedElements && preservedElements.trim().length > 0) {
      prompt += `\n\nCRITICAL INSTRUCTION - OBJECT PRESERVATION:
      Strictly analyze the input image to identify and isolate the following elements: "${preservedElements}".
      1. PIXEL-LEVEL ALIGNMENT: The "${preservedElements}" must maintain its exact original X/Y coordinates on the canvas. Do not offset, scale, move, or shift the object even by 1 pixel.
      2. IDENTITY LOCK: Render the core body of the "${preservedElements}" with 100% fidelity to the original design, material, and contours.
      3. STYLE ISOLATION: Do not apply any textures or materials from the new "${style}" aesthetic to the structural body of the "${preservedElements}".
      4. STATIONARY ASSET: The object is a fixed reference point. Redesign the environment BEHIND and AROUND it, but do not touch the asset itself.
      5. MODEL INTEGRITY FORBIDDEN SUBSTITUTION: You are prohibited from replacing the "${preservedElements}" with a different model or SKU. Contours and geometry MUST be preserved precisely.
      6. AUTHORIZED DYNAMIC STAGING: You are authorized to update or remove transient accessories and propping (e.g., bottles, towels, containers) sitting on or inside the "${preservedElements}" only where necessary to stylistically align with the "${style}" look.
      7. SELECTIVE RE-PROPPING: Do not aggressively clear the "${preservedElements}". Instead, selectively replace original staging items only if they clash significantly with the new aesthetic. Maintain a clean, high-end designer integration between the asset and propping.`;
  }

  // PHASE 5: STRUCTURAL SHELL & 4-TIER LOGIC
  if (isAestheticRefresh) {
      prompt += `\n\nCONSTRAINT - ROOM STRUCTURE (LEVEL 1: AESTHETIC REFRESH):
      Keep the architectural layout 100% identical to the original image. 
      - DO NOT add or remove windows, doors, or partitions. 
      - DO NOT change ceiling height or wall geometry.
      - FOCUS: Only update surface materials, colors, and textures.`;
  } else if (isSurfaceRenovation) {
      prompt += `\n\nCONSTRAINT - ROOM STRUCTURE (LEVEL 2: SURFACE RENOVATION):
      Keep the primary structural footprint (walls, windows, doors) identical. 
      - AUTHORIZED FREEDOM: You may add stylistic architectural propping such as crown moldings, wall paneling, built-in shelving, or trim work that defines the ${style} look.
      - PROHIBITED: Do not move windows or change the room's base geometry.`;
  } else if (isArchitecturalRemodel) {
      prompt += `\n\nFREEDOM - ARCHITECTURAL REMODEL (LEVEL 3: ARCHITECTURAL REMODEL):
      Redesign the internal room shell geometry. 
      - AUTHORIZED FREEDOM: Deconstruct and rebuild the architecture (walls and ceilings). You may change ceiling styles (tray, vaulted, coffered) and add structural partitions.
      - CONSTRAINT: You MUST keep all windows and exterior doors in their exact original X/Y positions.
      - NO OVER-PROPPING: Focus on the architectural surfaces. Do not add excessive decorative clutter.`;
  } else {
      prompt += `\n\nFREEDOM - ARCHITECTURAL METAMORPHOSIS (LEVEL 4: TOTAL METAMORPHOSIS):
      Execute a complete deconstruction and rebuilding of the room environment.
      - AUTHORIZED FREEDOM: Change window positions, add skylights, remove partitions, and completely change the room's footprint and geometry. 
      - ANCHOR POINT CONSTRAINT: The floor plane directly beneath the "${preservedElements || 'main object'}" must remain identical in geometry to ensure the asset stays anchored at its original coordinates.
      - NO OVER-PROPPING: Prioritize the new architectural geometry over decorative items. The redesign must feel structural, not just re-decorated.`;
  }

  // PHASE 6: AESTHETIC TRANSFORMATION & METALLIC SELECTION
  prompt += `\n\nTRANSFORMATION GOAL:
  Redesign the environment to match a "${style}" aesthetic.
  STYLE DIRECTION: ${styleGuidance}
  KEY CHARACTERISTICS: ${specificAesthetic}.

  METALLIC TARGET SELECTION:
  Identify the single most appropriate metallic finish for the "${style}" aesthetic (e.g., Brushed Brass, Matte Black, or Polished Chrome). This finish will serve as the "Master Finish" for the room.

  MATERIALITY DIRECTIVE: 
  Interpret style through material depth. Focus on how light interacts with textures. Prioritize tactile realism.`;

  // PHASE 7: FIXTURE COHERENCE & STYLE ADAPTATION (ENFORCEMENT)
  prompt += `\n\nCRITICAL INSTRUCTION - FIXTURE COHERENCE & STYLE ADAPTATION:
  1. ADAPTIVE UPDATING: You are AUTHORIZED and encouraged to update the metallic finish of any hardware or fixtures on the preserved "${preservedElements || 'object'}" to match the chosen "Master Finish" from the previous section.
  2. UNIFIED HARDWARE: Establish absolute visual harmony. Apply the "Master Finish" with 100% consistency to ALL metallic elements: the fixtures on the preserved object, lighting frames, and cabinet hardware.`;

  prompt += `\n\nFINAL OUTPUT: Photorealistic 8k architectural render. High-end photography. Zero perspective drift.

  MANDATORY PERSPECTIVE OVERRIDE:
  You are FORBIDDEN from changing the camera angle or the X/Y position of the "${preservedElements}". The output MUST align pixel-perfectly with the input.`;

  return prompt;
}

export const promptTypes: { value: PromptType; label: string; description: string }[] = [
  {
    value: "room-scene",
    label: "Room Scene",
    description: "Transform the room design while preserving specific elements",
  },
];