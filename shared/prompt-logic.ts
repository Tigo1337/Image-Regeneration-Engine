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

interface PromptPolicy {
  preservationMode: "strict-pixel-lock" | "geometry-lock";
  structureMode: "locked" | "conservative" | "remodel" | "metamorphosis";
  allowPerspectiveRecalculation: boolean;
}

const globalNegativePromptTaxonomy = [
  "No warped geometry",
  "No duplicated fixtures",
  "No floating furniture",
  "No melted edges",
  "No smeared textures",
  "No broken symmetry",
  "No inconsistent reflections",
  "No impossible shadows",
  "No oversaturated highlights",
];

function resolvePromptPolicy(creativityLevel: number, hasPreservedElements: boolean): PromptPolicy {
  if (creativityLevel <= 1) {
    return {
      preservationMode: "strict-pixel-lock",
      structureMode: "locked",
      allowPerspectiveRecalculation: false,
    };
  }

  if (creativityLevel === 2) {
    return {
      preservationMode: hasPreservedElements ? "strict-pixel-lock" : "geometry-lock",
      structureMode: "conservative",
      allowPerspectiveRecalculation: false,
    };
  }

  if (creativityLevel === 3) {
    return {
      preservationMode: "geometry-lock",
      structureMode: "remodel",
      allowPerspectiveRecalculation: false,
    };
  }

  return {
    preservationMode: hasPreservedElements ? "geometry-lock" : "strict-pixel-lock",
    structureMode: "metamorphosis",
    allowPerspectiveRecalculation: true,
  };
}

function buildPerspectiveSection(policy: PromptPolicy): string {
  if (policy.allowPerspectiveRecalculation) {
    return `[SCENE_CONSTRAINTS]
- CAMERA_POSITION: Keep camera height and distance anchored to the source scene.
- HORIZON_LOCK: Keep horizon line at the same vertical position.
- VANISHING_POINTS: You may re-calculate vanishing points to support new architecture only.
`;
  }

  return `[SCENE_CONSTRAINTS]
- HORIZON_LOCK: Keep the exact horizon line vertical position from source image.
- VANISHING_POINTS_LOCK: All orthogonal lines must converge to source-image vanishing points.
- CAMERA_LOCK: No camera tilt/pan drift.
`;
}

function buildPreservationSection(preservedElements: string, policy: PromptPolicy): string {
  if (!preservedElements || preservedElements.trim().length === 0) {
    return `[PRESERVE_OBJECT]
- No user-designated preserved object supplied.
- Preserve overall room realism and avoid geometric drift.
`;
  }

  const lockMode =
    policy.preservationMode === "strict-pixel-lock"
      ? "PIXEL_LOCK: Preserve exact object geometry, orientation, placement, and silhouette."
      : "GEOMETRY_LOCK: Preserve object shape/orientation/placement. Surface refinishing on hardware is allowed.";

  return `[PRESERVE_OBJECT]
- TARGET: "${preservedElements}".
- ${lockMode}
- STYLE_ISOLATION: Do not redesign the core body of preserved objects.
- ACCESSORY_RULE: Portable accessories may be harmonized only if they do not alter core geometry.
`;
}

function buildStructureSection(policy: PromptPolicy, preservedElements: string): string {
  const preservedLabel = preservedElements || "main object";

  if (policy.structureMode === "locked") {
    return `[STRUCTURE_POLICY]
- ROOM_STRUCTURE: Keep architectural layout identical.
- ALLOWED_CHANGES: Surface materials, color palette, and decor micro-adjustments only.
`;
  }

  if (policy.structureMode === "conservative") {
    return `[STRUCTURE_POLICY]
- ROOM_STRUCTURE: Keep primary walls/openings in place.
- ALLOWED_CHANGES: Decorative moldings, lighting fixtures, finishes, and furniture styling.
`;
  }

  if (policy.structureMode === "remodel") {
    return `[STRUCTURE_POLICY]
- ROOM_REMODEL: Internal shell redesign is allowed.
- OPENINGS_LOCK: Doors and windows should remain in original approximate positions.
`;
  }

  return `[STRUCTURE_POLICY]
- ARCHITECTURAL_METAMORPHOSIS: Full redesign is authorized.
- PRESERVATION_BOUNDARY: "${preservedLabel}" remains a no-fly geometry zone.
- REPLACEMENT_MANDATE: Rebuild all non-preserved regions with new structural logic.
`;
}

export function constructRoomScenePrompt(config: PromptConfig): string {
  const { 
    style, 
    preservedElements, 
    addedElements = "",
    cameraZoom = 100,
    creativityLevel = 2,
    customStyleDescription 
  } = config;

  const specificAesthetic = customStyleDescription || styleDescriptions[style] || styleDescriptions["Scandinavian"];
  const hasPreservedElements = Boolean(preservedElements && preservedElements.trim().length > 0);
  const policy = resolvePromptPolicy(creativityLevel, hasPreservedElements);

  const isMetamorphosis = policy.structureMode === "metamorphosis";

  let styleGuidance = "";
  if (policy.structureMode === "locked") {
      styleGuidance = `Follow the ${style} aesthetic with clinical, textbook precision. Maintain a 'Restoration' mindset.`;
  } else if (policy.structureMode === "conservative") {
      styleGuidance = `Provide a standard, balanced interpretation of the ${style} aesthetic, focusing on cohesive materials and professional propping.`;
  } else if (policy.structureMode === "remodel") {
      styleGuidance = `Execute a high-end designer remodel of ${style}. Introduce sophisticated architectural textures and professional lighting.`;
  } else {
      styleGuidance = `Execute a 'Mandatory Architectural Metamorphosis.' Provide a unique, avant-garde 'Designer Signature' take on ${style} focusing on structural geometry.`;
  }

  let prompt = `[ROLE]
You are an expert interior designer and architectural visualizer specialized in photorealistic edits.
`;

  if (cameraZoom < 85) {
      prompt += `
[COMPOSITION_MODE]
- MODE: Outpainting.
- CONTEXT: Input image is centered with surrounding white space.
- TASK: Extend floor, ceiling, and walls seamlessly from existing center content.
`;
  } else if (cameraZoom > 115) {
      prompt += `
[COMPOSITION_MODE]
- MODE: Macro material detail.
- CONTEXT: Input image is a zoomed-in crop.
- TASK: Prioritize texture fidelity, micro-surface detail, and physically plausible material response.
`;
  }

  prompt += `
${buildPerspectiveSection(policy)}
${buildPreservationSection(preservedElements, policy)}
${buildStructureSection(policy, preservedElements)}
[STYLE_TARGET]
- STYLE: ${style}
- STYLE_GUIDANCE: ${styleGuidance}
- KEY_CHARACTERISTICS: ${specificAesthetic}
- HARDWARE_STRATEGY: Apply a single master metallic finish across visible hardware.
${addedElements.trim() ? `- ADDED_ELEMENTS: Add and integrate "${addedElements}" naturally into the scene.\n` : ""}
${isMetamorphosis ? "- METAMORPHOSIS_DIRECTIVE: Build a new environment around preserved-object boundaries.\n" : ""}
[NEGATIVE_PROMPT]
- ${globalNegativePromptTaxonomy.join("\n- ")}

[OUTPUT_SPEC]
- Photorealistic architectural render quality.
- Preserve camera framing and object placement constraints.
- Ensure coherent lighting, shadows, and material responses.
`;

  return prompt;
}

export const promptTypes: { value: PromptType; label: string; description: string }[] = [
  {
    value: "room-scene",
    label: "Room Scene",
    description: "Transform the room design while preserving specific elements",
  },
];
