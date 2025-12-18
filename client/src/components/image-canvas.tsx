import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Maximize, Download, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { ImageModal } from "./image-modal";
import type { RoomRedesignRequest } from "@shared/schema";

// Simple custom compare slider to avoid external deps if needed, 
// but functionally mimicking react-compare-slider
const CompareSlider = ({ before, after }: { before: string, after: string }) => {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative w-full h-full overflow-hidden select-none group cursor-ew-resize"
         onMouseMove={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
           setPosition((x / rect.width) * 100);
         }}
         onTouchMove={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
           setPosition((x / rect.width) * 100);
         }}
    >
      {/* Background (After) */}
      <img src={after} alt="After" className="absolute top-0 left-0 w-full h-full object-contain" />

      {/* Foreground (Before) - Clipped */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden" style={{ width: `${position}%` }}>
        <img src={before} alt="Before" className="absolute top-0 left-0 max-w-none h-full object-contain" 
             style={{ width: '100%', height: '100%', objectFit: 'contain' }} // Simplified adaptation
             // In a real responsive grid, calculating exact object-contain overlap is tricky without JS math 
             // or sticking to object-cover. For product images, we assume consistent aspect ratio.
        />
        {/* Force aspect ratio match if possible, or use background-image approach */}
        <div className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${before})` }}></div>
      </div>

      {/* Handle */}
      <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-md z-10" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-primary">
          <SlidersHorizontal className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

interface ImageCanvasProps {
  originalImage: string | null;
  generatedImage: string | null;
  generatedVariations?: string[]; // Step 4: Support multiple
  originalFileName?: string;
  currentFormData?: RoomRedesignRequest;
}

export function ImageCanvas({
  originalImage,
  generatedImage,
  generatedVariations = [],
  originalFileName = "image",
  currentFormData,
}: ImageCanvasProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [activeVariation, setActiveVariation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'slider'>('slider');

  // Use active variation if selected, otherwise default generated image
  const currentDisplayImage = activeVariation || generatedImage;

  const openModal = (image: string, title: string) => {
    setModalImage(image);
    setModalTitle(title);
    setModalOpen(true);
  };

  const generateDownloadFileName = (): string => {
    if (!currentFormData) return originalFileName;
    return `redesign-${Date.now()}`;
  };

  const downloadImage = () => {
    if (!currentDisplayImage) return;
    const link = document.createElement("a");
    link.href = currentDisplayImage;
    link.download = `${generateDownloadFileName()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!originalImage) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-muted">
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            No Image Loaded
          </h2>
          <p className="text-muted-foreground">
            Upload a product image to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full p-8 overflow-auto flex flex-col gap-6">

        {/* Main Display Area */}
        <div className="flex-1 min-h-[500px] w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {currentDisplayImage ? "Comparison Preview" : "Original Image"}
            </h3>
            {currentDisplayImage && (
              <div className="flex gap-2">
                 <Button
                  size="sm"
                  variant={viewMode === 'slider' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('slider')}
                  title="Slider View"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Slider
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('split')}
                  title="Split View"
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Split
                </Button>
                <Button size="icon" variant="ghost" onClick={downloadImage}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <Card className="w-full h-[600px] bg-muted/20 overflow-hidden relative border-2 border-border/50">
            {currentDisplayImage ? (
              viewMode === 'slider' ? (
                // Step 2: Slider Implementation (Simulated for portability)
                <div className="relative w-full h-full group">
                   {/* Note: A true CSS-only slider is tricky for responsive images. 
                      Ideally, install 'react-compare-slider'. 
                      This is a placeholder logic for the structure.
                   */}
                   <div className="w-full h-full flex">
                      <div className="flex-1 relative border-r border-white/20">
                         <img src={originalImage} className="w-full h-full object-contain p-4" alt="Original"/>
                         <span className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs">Original</span>
                      </div>
                      <div className="flex-1 relative">
                         <img src={currentDisplayImage} className="w-full h-full object-contain p-4" alt="Generated"/>
                         <span className="absolute bottom-4 right-4 bg-primary/80 text-white px-2 py-1 rounded text-xs">Generated</span>
                      </div>
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                      <p className="bg-background/80 px-3 py-1 rounded-full text-xs">Install 'react-compare-slider' for interactive sliding</p>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 h-full gap-1">
                  <div className="h-full bg-background flex items-center justify-center p-4">
                    <img src={originalImage} className="max-w-full max-h-full object-contain" alt="Original"/>
                  </div>
                  <div className="h-full bg-background flex items-center justify-center p-4">
                    <img src={currentDisplayImage} className="max-w-full max-h-full object-contain" alt="Generated"/>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img src={originalImage} className="max-w-full max-h-full object-contain" alt="Original"/>
              </div>
            )}
          </Card>
        </div>

        {/* Step 4: Batch Variations Thumbnails */}
        {(generatedVariations.length > 0 || generatedImage) && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-3">Variations</h4>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {/* Original */}
              <div 
                className="w-32 h-32 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 border-transparent hover:border-primary/50"
                onClick={() => setActiveVariation(null)} // Reset to original/main
              >
                <img src={originalImage} className="w-full h-full object-cover opacity-70 hover:opacity-100" />
              </div>

              {/* Main Generated */}
              {generatedImage && (
                <div 
                  className={`w-32 h-32 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${currentDisplayImage === generatedImage ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                  onClick={() => setActiveVariation(generatedImage)}
                >
                  <img src={generatedImage} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Extra Variations */}
              {generatedVariations.map((img, idx) => (
                <div 
                  key={idx}
                  className={`w-32 h-32 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${currentDisplayImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                  onClick={() => setActiveVariation(img)}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={modalImage || ""}
        imageAlt={modalTitle}
        onDownload={downloadImage}
      />
    </>
  );
}