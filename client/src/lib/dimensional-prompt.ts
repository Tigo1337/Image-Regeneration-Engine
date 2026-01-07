import type { DimensionalImageRequest } from "@shared/schema";

export function constructDimensionalPrompt(config: DimensionalImageRequest): string {
  const { 
    productType, 
    productHeight, 
    productWidth, 
    productDepth,
    showTopLegend = true, 
    showBottomDisclaimer = true 
  } = config;

  let annotationLogic = "";

  if (productType === "Shower" || productType === "Tub Shower") {
    annotationLogic = `- HEIGHT: Vertical line matching total vertical bounds. Label: '${productHeight}'.
  - WIDTH: Horizontal line across front threshold. Label: '${productWidth}'.
  - DEPTH: Line following depth perspective on side panel. Label: '${productDepth}'.`;
  } else if (productType === "Shower Base") {
    annotationLogic = `- WIDTH: Line across longest horizontal edge. Label: '${productWidth}'.
  - DEPTH: Line along perpendicular horizontal edge. Label: '${productDepth}'.
  - HEIGHT (LIP): Small vertical callout at front lip. Label: '${productHeight}'.`;
  } else {
    annotationLogic = `- HEIGHT: Vertical line for total exterior height. Label: '${productHeight}'.
  - WIDTH: Horizontal line for total exterior width across front. Label: '${productWidth}'.
  - DEPTH: Line following depth perspective for exterior side. Label: '${productDepth}'.`;
  }

  return `Act as an expert Image Compositor and Technical Editor. Do NOT act as a 3D renderer. 
Your goal is to add technical annotations to the image while preserving the original product photography exactly.

1. DIMENSION STYLE (LABELS & LINES):
- FONT: Use "Arial" for all dimension labels.
- SIZE: **All dimension labels must be exactly 12px.**
- COLOR: All labels and lines must be Hex #000000 (Pure Black).
- LINE WEIGHT: **All dimension lines and arrows must be exactly 2px thick.**
- STYLE: No bold, no italics. Lines must be solid and clean.

2. DIMENSION VALUES (STRICT ADHERENCE):
- You MUST use these exact strings:
* HEIGHT LABEL: '${productHeight}'
* WIDTH LABEL: '${productWidth}'
* DEPTH LABEL: '${productDepth}'

3. IMAGE PRESERVATION & COMPOSITION:
- Pixel Freeze: Strictly preserve the original product photography.
- Target Size: Product occupies 60% of vertical space.
- Outpainting: Final output must be 1:1 (Square) with a seamless white border.

4. SPATIAL ANALYSIS & PADDING:
- Offset dimension lines from product by 10% of product width.
- PADDING RULE: All corner text (Legend/Disclaimer) must be exactly 40 pixels from canvas edges.

5. ANNOTATION PLACEMENT:
${annotationLogic}

${showTopLegend ? `
6. TOP LEGEND (Fixed Layout):
- Text: 'Dimensions in inches (in.) / Dimensions en pouces (po)'
- Style: Font Arial, Size 12px, Color #000000.
- Position: Top-Right corner (40px padding).` : ''}

${showBottomDisclaimer ? `
7. BOTTOM DISCLAIMER (Fixed Layout):
- Text: 'All dimensions are approximate. Structure measurements must be verified against the unit to ensure proper fit. Please see the detailed technical drawing for additional measurements.' / 'Toutes ces dimensions sont approximatives. Afin d'assurer une installation parfaite, les dimensions de la structure doivent être vérifiées à partir de l'unité. Référez-vous au dessin technique pour les mesures supplémentaires.'
- Style: Font Arial, Size 12px, Color #000000.
- Position: Bottom-Left corner (40px padding).` : ''}

8. NEGATIVE CONSTRAINTS:
- No bold fonts.
- No line weights other than 2px.
- No text sizes other than 12px.
- Do not write margin/padding numbers (e.g., '40px' or '12px') on the actual image.`;
}
