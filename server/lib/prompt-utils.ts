// Prompt Builder Interfaces
export interface ModificationPromptParams {
  modificationRequest: string;
  currentStyle: string;
  preservedElements: string;
  creativityLevel: number;
}

export interface VariationFormData {
  targetStyle?: string;
  referenceImages?: string[];
  referenceDrawing?: string;
  preservedElements?: string;
  quality?: string;
  aspectRatio?: string;
  outputFormat?: string;
  structureAnalysis?: string | null;
}

// Prompt Builder for Modification Requests
export function buildModificationPrompt(params: ModificationPromptParams): string {
  const { modificationRequest, currentStyle, preservedElements, creativityLevel } = params;
  
  // Map creativity level to instruction intensity
  const creativityInstructions: Record<number, string> = {
    1: "Make ONLY the specific change requested. Preserve everything else exactly as-is. Zero creative interpretation.",
    2: "Apply the requested modification while maintaining visual consistency. Minor harmonizing adjustments are acceptable.",
    3: "Apply the modification and feel free to make supporting aesthetic adjustments that enhance the overall design.",
    4: "Apply the modification creatively. You may reinterpret elements to better integrate the change into a cohesive design.",
  };

  const creativityText = creativityInstructions[creativityLevel] || creativityInstructions[2];

  let prompt = `ROLE: Expert Interior Design Editor.

TASK: Apply a SPECIFIC MODIFICATION to the generated room design shown in the input image.

=== USER'S MODIFICATION REQUEST ===
"${modificationRequest}"
===================================

=== MODIFICATION RULES (STRICT) ===
1. FOCUSED CHANGE: Your ONLY task is to implement the user's modification request. This is NOT a full redesign.
2. PRESERVE EVERYTHING ELSE: All elements NOT mentioned in the modification request must remain EXACTLY as they appear in the input image.
3. STYLE CONTINUITY: The current design style is "${currentStyle}". Any modifications must be harmonious with this style.
4. PHOTOREALISTIC OUTPUT: The result must be indistinguishable from a real photograph. Match the lighting, shadows, and material quality of the input image.

=== CREATIVITY LEVEL: ${creativityLevel}/4 ===
${creativityText}

`;

  if (preservedElements && preservedElements.trim() !== "") {
    prompt += `=== PROTECTED ELEMENTS (DO NOT MODIFY) ===
The following elements are LOCKED and must remain EXACTLY as shown:
${preservedElements}
=============================================

`;
  }

  prompt += `=== OUTPUT REQUIREMENTS ===
1. Generate a photorealistic image showing the room with the requested modification applied.
2. Maintain the exact camera angle, perspective, and framing of the input image.
3. Preserve the lighting conditions and color temperature.
4. Ensure seamless integration of the modification into the existing scene.

CRITICAL: This is an EDIT operation, not a regeneration. The output should be 95%+ identical to the input, with only the requested modification visible.`;

  return prompt;
}

// Prompt Builder for Perspective Variations
export function buildVariationPrompt(formData: VariationFormData, variationType: string, structureAnalysis: string = ""): string {
  const style = formData.targetStyle || "the existing style";

  let prompt = `ROLE: Expert Architectural Visualizer.

  TASK: Generate a new view of the room shown in the input image.
  TARGET VIEW: ${variationType.toUpperCase()}.

  === GLOBAL CONSISTENCY CONTRACT (STRICT) ===
  1. THE FROZEN WORLD RULE: The Input Image represents a frozen, existing physical space. You are a photographer moving through it, NOT a designer creating it.
  2. NO REDESIGNING: You are FORBIDDEN from changing the style, furniture, decor, wall colors, flooring, or lighting. 
  3. 1:1 MAPPING: Every single object visible in the Input Image (no matter how small) MUST exist in this new view if the angle permits.
  4. ROOM INTEGRITY: The "Room" is a preserved object. You must not change the wall paint, the floor material, or the baseboard style.

  CRITICAL - HANDLING HIDDEN ANGLES:
  The Input Image only shows the Front. You MUST use the provided "Visual Reference Images" (if any) and the "3D Structure Analysis" below to reconstruct the hidden sides logically.
  `;

  prompt += `\n\nMATERIALITY & LIGHTING COHERENCE:
  1. Identify the primary light source in the original image. Maintain this light vector.
  2. Focus on material depth (wood grain, stone texture, fabric weave). 
  3. The surface quality must be consistent across all objects.`;

  if (structureAnalysis) {
    prompt += `\n\n=== 3D STRUCTURE ANALYSIS (GROUND TRUTH) ===
    Use this technical description to render the details correctly:
    ${structureAnalysis}
    ============================================\n`;
  }

  if (variationType === "Front") {
    prompt += `\n\nINSTRUCTION: FRONT ELEVATION.
    - Camera: Directly perpendicular to the main subject.
    - Perspective: Flattened / Orthographic-like.
    - Goal: A technical evaluation view of the front face.`;
  } 
  else if (variationType === "Side") {
    prompt += `\n\nINSTRUCTION: ANGLE VIEW (45-Degree).
    - Camera: Rotate 45 degrees to the side.
    - "TEXTURE LOCK": The texture on the side of the object (e.g., wood grain, tile pattern, fabric weave) must be CONTINUOUS with the front. Use the Reference Images to determine the side detail.
    - "ROOM EXTENSION (CRITICAL)": The camera rotation reveals more of the back wall. You must PREDICT this new area by strictly EXTENDING the existing wall/floor materials.
      * If the wall is white paint, the new area must be white paint.
      * If the floor is grey tile, the new area must be grey tile.
      * DO NOT ADD NEW OBJECTS (No plants, no windows, no art) unless they are partially visible in the original image.
    - "ATMOSPHERE PRESERVATION": The lighting mood and shadows must match the original image exactly.`;
  } 
  else if (variationType === "Top") {
    prompt += `\n\nINSTRUCTION: ARCHITECTURAL SECTION CUT (TOP VIEW).
    - Camera: 90-degree look-down, directly overhead.
    - ZOOM: Close-up on the main furniture/object. Fill the canvas.
    - "ALIGNMENT": The object must be strictly axis-aligned with the canvas, ensuring all horizontal edges are perfectly parallel to the top and bottom of the image frame.
    - "CEILING REMOVAL": Cut away the ceiling to see inside.
    - "OBJECT PERMANENCE": 
      * EVERY small detail on surfaces (towels, soap, faucets, handles, rugs) MUST be present.
      * Do NOT clean up the room. If there is clutter, render the clutter from above.
      * Wall-mounted items (mirrors, sconces) must be visible as "slices" or profiles attached to the wall line.
    - "ZERO DISTORTION": Walls must be straight lines. Floor patterns must be geometrically perfect from above.`;
  }

  return prompt;
}
