# RoomReimagine AI - Design Guidelines

## Design Approach
**System**: Dark mode theme with professional UI polish focused on utility and clarity for an AI-powered interior design tool.

**Core Principles**:
- Functional clarity over decorative elements
- Immediate visual feedback for user actions
- Professional, confident aesthetic suitable for design professionals

---

## Layout System

### Spacing
Use Tailwind units: **2, 4, 6, 8, 12, 16** for consistent rhythm (p-4, gap-6, mb-8, etc.)

### Grid Structure
**Two-column layout**:
- **Left Sidebar**: Fixed width (w-80 to w-96), full viewport height, controls area
- **Main Canvas**: Flexible remaining space, centered content display

---

## Typography

**Font Family**: 
- Primary: Inter or DM Sans via Google Fonts
- Monospace: JetBrains Mono for technical labels

**Hierarchy**:
- App Title: text-2xl font-bold
- Section Headers: text-lg font-semibold
- Form Labels: text-sm font-medium
- Input Text: text-base
- Helper Text: text-xs

---

## Component Library

### Sidebar Controls
**Tab System** (Upload / DAM):
- Horizontal tabs with active state indicator
- Each tab reveals corresponding input method

**Form Elements**:
1. **Drag-and-drop zone** (react-dropzone): Dashed border, centered icon and text, hover state
2. **Cloudinary URL input**: Text field with paste hint
3. **"Elements to Preserve" input**: Text input with prominent label emphasizing "CRUCIAL"
4. **Target Style dropdown**: Modern, Contemporary, Boho, Industrial, Scandinavian, Mid-Century Modern
5. **Quality/Resolution dropdown**: Standard, High Fidelity (2K), Ultra (4K)
6. **Aspect Ratio dropdown**: Original, 16:9, 1:1, 4:3
7. **Creativity Level slider**: 0-100 range with labels "Subtle Change" → "Total Transformation"

**Generate Button**: 
- Large, full-width within sidebar
- Prominent styling with distinct hover state
- Disabled state when no image loaded

### Main Canvas Area
**Image Display**:
- Initial state: Empty state with upload prompt
- After upload: Side-by-side comparison grid (Original | Generated)
- Images centered, max-width constraints for readability
- Equal-sized containers with consistent aspect ratios

**Loading State**:
- Full-screen overlay with spinner
- Semi-transparent backdrop
- Processing message beneath spinner

---

## Icons
**Library**: Lucide React (as specified)
- Upload: Upload icon
- Link: Link icon  
- Settings: Sliders icon
- Loading: Loader icon (animated)

---

## Interaction Patterns

**Image Upload Flow**:
1. Drag file OR paste URL → Immediate preview in canvas
2. Form controls become enabled
3. Configure preservation elements and style
4. Click Generate → Loading overlay → Results display

**Responsive Behavior**:
- Desktop: Two-column layout maintained
- Tablet/Mobile: Stack sidebar above canvas, collapsible sections

---

## Images
No hero images required. This is a utility-focused application where the user-uploaded images ARE the primary visual content.

---

## Key Visual Details
- All dropdowns: Consistent height (h-10), rounded corners
- Input fields: Subtle border, focus ring on interaction
- Slider: Custom track styling with visible thumb
- Spacing between form groups: mb-6
- Canvas padding: p-8 to p-12
- Image comparison: gap-4 to gap-6 between original and generated