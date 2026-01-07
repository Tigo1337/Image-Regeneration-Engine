import type { DimensionalImageRequest } from "@shared/schema";

export function constructDimensionalPrompt(config: DimensionalImageRequest): string {
  const { 
    productType, 
    productHeight, 
    productWidth, 
    productDepth,
    heightPlacement = "Left Side (Vertical)",
    widthPlacement = "Front Bottom",
    depthPlacement = "Left Side (Perspective)",
    productFillRatio = 60,
    showTopLegend = true, 
    showBottomDisclaimer = true 
  } = config;

  const heightLineDesc = getHeightDescription(heightPlacement, productHeight);
  const widthLineDesc = getWidthDescription(widthPlacement, productWidth);
  const depthLineDesc = getDepthDescription(depthPlacement, productDepth);

  return `Act as an expert Image Compositor and Technical Editor. Do NOT act as a 3D renderer.
Your goal is to add technical dimension annotations to the image while preserving the original product photography exactly.

=== EXACT DIMENSION COUNT (MANDATORY) ===

You MUST add EXACTLY THREE (3) dimension annotations to this image:
1. ONE Height dimension showing "${productHeight}"
2. ONE Width dimension showing "${productWidth}"  
3. ONE Depth dimension showing "${productDepth}"

CONFIRM before rendering: Height="${productHeight}", Width="${productWidth}", Depth="${productDepth}" - exactly these three values, each appearing exactly once.

=== CRITICAL REQUIREMENTS (MANDATORY) ===

1. ARROWHEADS (STRICT ENFORCEMENT):
   - EVERY dimension line MUST have arrowheads at BOTH ends.
   - Arrow style: Solid filled triangular arrowheads pointing outward from the measurement.
   - Arrow size: Proportional to line weight (approximately 8px long, 6px wide base).
   - NO dimension line may exist without TWO arrowheads (one at each endpoint).

2. LINE SPECIFICATIONS:
   - Line weight: Exactly 2px thick for all dimension lines.
   - Line color: Pure black (#000000).
   - Line style: Solid, clean, no dashes.
   - Extension lines: Small perpendicular lines (serifs) at endpoints where line meets product edge.

3. PARALLEL LINE ALIGNMENT (STRICT ENFORCEMENT):
   - HEIGHT line must be PERFECTLY VERTICAL (90 degrees) - zero angle deviation.
   - WIDTH line must be PERFECTLY HORIZONTAL (0 degrees) - zero angle deviation.
   - DEPTH line follows perspective but must align precisely with the product's perspective edge.
   - NO diagonal or tilted lines except where perspective demands for depth.
   - If a line appears misaligned, mentally re-render until perfectly parallel to the edge it measures.

4. LABEL SPECIFICATIONS:
   - Font: Arial Regular (no bold, no italics).
   - Size: Exactly 12px for all dimension labels.
   - Color: Pure black (#000000).
   - Position: Centered along dimension line, with small white/background buffer behind text for readability.

=== DIMENSION LINE PLACEMENTS ===

5. HEIGHT DIMENSION (show "${productHeight}" exactly once):
   ${heightLineDesc}

6. WIDTH DIMENSION (show "${productWidth}" exactly once):
   ${widthLineDesc}

7. DEPTH DIMENSION (show "${productDepth}" exactly once):
   ${depthLineDesc}

=== IMAGE COMPOSITION & PRODUCT SIZING ===

8. PRODUCT FILL RATIO:
   - Scale/zoom the product so it occupies approximately ${productFillRatio}% of the canvas area.
   - Center the product within the frame.
   - Preserve the product's aspect ratio - do not stretch or distort.
   - Leave adequate margin around the product for dimension lines and labels.

9. PRESERVATION:
   - Pixel-freeze the original product photography. No alterations to the product itself.
   - Final output: 1:1 (Square) aspect ratio with seamless white border/background.

10. SPATIAL LAYOUT:
   - Offset dimension lines from product surface by 8-12% of product width.
   - Dimension lines must NOT overlap each other or obscure product features.
   - Maintain clear visual hierarchy: product first, then dimensions.

${showTopLegend ? `
11. TOP LEGEND:
   - Text: "Dimensions in inches (in.) / Dimensions en pouces (po)"
   - Font: Arial, 10px, #000000.
   - Position: Top-right corner, 40px from canvas edges.
` : ''}

${showBottomDisclaimer ? `
12. BOTTOM DISCLAIMER:
   - English: "All dimensions are approximate. Structure measurements must be verified against the unit to ensure proper fit. Please see the detailed technical drawing for additional measurements."
   - French: "Toutes ces dimensions sont approximatives. Afin d'assurer une installation parfaite, les dimensions de la structure doivent être vérifiées à partir de l'unité. Référez-vous au dessin technique pour les mesures supplémentaires."
   - Font: Arial, 10px, #000000.
   - Position: Bottom-left corner, 40px from canvas edges.
` : ''}

=== NEGATIVE CONSTRAINTS (STRICTLY PROHIBITED) ===
- NO duplicate dimension values. Each of the three measurements appears EXACTLY ONCE.
- NO extra dimension lines beyond the three specified (height, width, depth).
- NO dimension lines without arrowheads at BOTH ends.
- NO diagonal height or width lines - they must be perfectly vertical/horizontal.
- NO bold or italic text.
- NO line weights other than 2px.
- NO text sizes other than specified.
- Do NOT show the same measurement value in multiple locations.
- Do NOT add any dimension annotations that were not explicitly requested.`;
}

function getHeightDescription(placement: string, value: string): string {
  switch (placement) {
    case "Left Side (Vertical)":
      return `- Draw a PERFECTLY VERTICAL line on the LEFT side of the product.
   - Line MUST be exactly 90 degrees (straight up and down), parallel to the left edge.
   - Line runs from the TOP of the product to the BOTTOM.
   - MUST have arrowheads at BOTH ends (top pointing up, bottom pointing down).
   - Label: "${value}" positioned to the left of the line, vertically centered.
   - This is the ONLY place where "${value}" appears for height.`;
    case "Right Side (Vertical)":
      return `- Draw a PERFECTLY VERTICAL line on the RIGHT side of the product.
   - Line MUST be exactly 90 degrees (straight up and down), parallel to the right edge.
   - Line runs from the TOP of the product to the BOTTOM.
   - MUST have arrowheads at BOTH ends (top pointing up, bottom pointing down).
   - Label: "${value}" positioned to the right of the line, vertically centered.
   - This is the ONLY place where "${value}" appears for height.`;
    case "Left Panel Edge":
      return `- Draw a PERFECTLY VERTICAL line along the left panel edge of the product.
   - Line MUST be exactly 90 degrees, following the visible left panel from TOP to BOTTOM.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" positioned adjacent to the line.
   - This is the ONLY place where "${value}" appears for height.`;
    default:
      return `- Draw a PERFECTLY VERTICAL height dimension line.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" - appears only once.`;
  }
}

function getWidthDescription(placement: string, value: string): string {
  switch (placement) {
    case "Front Bottom":
      return `- Draw a PERFECTLY HORIZONTAL line across the FRONT BOTTOM edge of the product.
   - Line MUST be exactly 0 degrees (perfectly level), parallel to the front edge.
   - Line spans the full width of the front face, positioned below the product base.
   - MUST have arrowheads at BOTH ends (left pointing left, right pointing right).
   - Label: "${value}" positioned below the line, horizontally centered.
   - This is the ONLY place where "${value}" appears for width.`;
    case "Front Top":
      return `- Draw a PERFECTLY HORIZONTAL line across the FRONT TOP edge of the product.
   - Line MUST be exactly 0 degrees (perfectly level), parallel to the front edge.
   - Line spans the full width of the front face, positioned above the product.
   - MUST have arrowheads at BOTH ends (left pointing left, right pointing right).
   - Label: "${value}" positioned above the line, horizontally centered.
   - This is the ONLY place where "${value}" appears for width.`;
    case "Below Product":
      return `- Draw a PERFECTLY HORIZONTAL line BELOW the product footprint.
   - Line MUST be exactly 0 degrees (perfectly level).
   - Line spans the full width, with clearance below the product.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" positioned below the line, horizontally centered.
   - This is the ONLY place where "${value}" appears for width.`;
    default:
      return `- Draw a PERFECTLY HORIZONTAL width dimension line.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" - appears only once.`;
  }
}

function getDepthDescription(placement: string, value: string): string {
  switch (placement) {
    case "Left Side (Perspective)":
      return `- Draw a dimension line following the DEPTH perspective on the LEFT SIDE of the product.
   - Line follows the floor/base edge going from front-left corner toward back-left corner.
   - Line angle MUST precisely match the product's perspective edge - align with the vanishing point.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" positioned along or adjacent to the line.
   - This is the ONLY place where "${value}" appears for depth.`;
    case "Right Side (Perspective)":
      return `- Draw a dimension line following the DEPTH perspective on the RIGHT SIDE of the product.
   - Line follows the floor/base edge going from front-right corner toward back-right corner.
   - Line angle MUST precisely match the product's perspective edge - align with the vanishing point.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" positioned along or adjacent to the line.
   - This is the ONLY place where "${value}" appears for depth.`;
    case "Top Edge (Perspective)":
      return `- Draw a dimension line along the TOP EDGE showing depth.
   - Line follows the top surface edge in perspective, aligned with product's vanishing point.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" positioned along or adjacent to the line.
   - This is the ONLY place where "${value}" appears for depth.`;
    default:
      return `- Draw a DEPTH dimension line following the product's perspective.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" - appears only once.`;
  }
}
