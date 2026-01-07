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
    showTopLegend = true, 
    showBottomDisclaimer = true 
  } = config;

  const heightLineDesc = getHeightDescription(heightPlacement, productHeight);
  const widthLineDesc = getWidthDescription(widthPlacement, productWidth);
  const depthLineDesc = getDepthDescription(depthPlacement, productDepth);

  return `Act as an expert Image Compositor and Technical Editor. Do NOT act as a 3D renderer.
Your goal is to add technical dimension annotations to the image while preserving the original product photography exactly.

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

3. LABEL SPECIFICATIONS:
   - Font: Arial Regular (no bold, no italics).
   - Size: Exactly 12px for all dimension labels.
   - Color: Pure black (#000000).
   - Position: Centered along dimension line, with small white/background buffer behind text for readability.

=== DIMENSION LINE PLACEMENTS ===

4. HEIGHT DIMENSION:
   ${heightLineDesc}

5. WIDTH DIMENSION:
   ${widthLineDesc}

6. DEPTH DIMENSION:
   ${depthLineDesc}

=== IMAGE COMPOSITION ===

7. PRESERVATION:
   - Pixel-freeze the original product photography. No alterations to the product itself.
   - Product should occupy approximately 60% of vertical canvas space.
   - Final output: 1:1 (Square) aspect ratio with seamless white border/background.

8. SPATIAL LAYOUT:
   - Offset dimension lines from product surface by 10% of product width.
   - Dimension lines must NOT overlap each other or obscure product features.
   - Maintain clear visual hierarchy: product first, then dimensions.

${showTopLegend ? `
9. TOP LEGEND:
   - Text: "Dimensions in inches (in.) / Dimensions en pouces (po)"
   - Font: Arial, 12px, #000000.
   - Position: Top-right corner, 40px from canvas edges.
` : ''}

${showBottomDisclaimer ? `
10. BOTTOM DISCLAIMER:
   - English: "All dimensions are approximate. Structure measurements must be verified against the unit to ensure proper fit. Please see the detailed technical drawing for additional measurements."
   - French: "Toutes ces dimensions sont approximatives. Afin d'assurer une installation parfaite, les dimensions de la structure doivent être vérifiées à partir de l'unité. Référez-vous au dessin technique pour les mesures supplémentaires."
   - Font: Arial, 12px, #000000.
   - Position: Bottom-left corner, 40px from canvas edges.
` : ''}

=== NEGATIVE CONSTRAINTS ===
- NO dimension lines without arrowheads at BOTH ends.
- NO bold or italic text.
- NO line weights other than 2px.
- NO text sizes other than 12px (except for legend/disclaimer which may be smaller if space requires).
- Do NOT write technical specifications (px values, measurements) visibly on the final image except the actual dimension values.`;
}

function getHeightDescription(placement: string, value: string): string {
  switch (placement) {
    case "Left Side (Vertical)":
      return `- Draw a VERTICAL line on the LEFT side of the product, parallel to the left edge.
   - Line runs from the TOP of the product to the BOTTOM.
   - MUST have arrowheads at BOTH ends (top pointing up, bottom pointing down).
   - Label: "${value}" positioned to the left of the line, vertically centered.`;
    case "Right Side (Vertical)":
      return `- Draw a VERTICAL line on the RIGHT side of the product, parallel to the right edge.
   - Line runs from the TOP of the product to the BOTTOM.
   - MUST have arrowheads at BOTH ends (top pointing up, bottom pointing down).
   - Label: "${value}" positioned to the right of the line, vertically centered.`;
    case "Left Panel Edge":
      return `- Draw a VERTICAL line along the left panel edge of the product.
   - Line follows the visible left panel from TOP to BOTTOM.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" positioned adjacent to the line.`;
    default:
      return `- Draw a VERTICAL height dimension line.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}".`;
  }
}

function getWidthDescription(placement: string, value: string): string {
  switch (placement) {
    case "Front Bottom":
      return `- Draw a HORIZONTAL line across the FRONT BOTTOM edge of the product.
   - Line spans the full width of the front face, positioned below the product base.
   - MUST have arrowheads at BOTH ends (left pointing left, right pointing right).
   - Label: "${value}" positioned below the line, horizontally centered.`;
    case "Front Top":
      return `- Draw a HORIZONTAL line across the FRONT TOP edge of the product.
   - Line spans the full width of the front face, positioned above the product.
   - MUST have arrowheads at BOTH ends (left pointing left, right pointing right).
   - Label: "${value}" positioned above the line, horizontally centered.`;
    case "Below Product":
      return `- Draw a HORIZONTAL line BELOW the product footprint.
   - Line spans the full width, with clearance below the product.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" positioned below the line, horizontally centered.`;
    default:
      return `- Draw a HORIZONTAL width dimension line.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}".`;
  }
}

function getDepthDescription(placement: string, value: string): string {
  switch (placement) {
    case "Left Side (Perspective)":
      return `- Draw a dimension line following the DEPTH perspective on the LEFT SIDE of the product.
   - Line follows the floor/base edge going from front-left corner toward back-left corner.
   - Line angle must match the product's perspective/vanishing point.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" positioned along or adjacent to the line.`;
    case "Right Side (Perspective)":
      return `- Draw a dimension line following the DEPTH perspective on the RIGHT SIDE of the product.
   - Line follows the floor/base edge going from front-right corner toward back-right corner.
   - Line angle must match the product's perspective/vanishing point.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" positioned along or adjacent to the line.`;
    case "Top Edge (Perspective)":
      return `- Draw a dimension line along the TOP EDGE showing depth.
   - Line follows the top surface edge in perspective.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}" positioned along or adjacent to the line.`;
    default:
      return `- Draw a DEPTH dimension line in perspective.
   - MUST have arrowheads at BOTH ends.
   - Label: "${value}".`;
  }
}
