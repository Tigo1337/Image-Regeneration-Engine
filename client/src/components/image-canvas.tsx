import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Download, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { ImageModal } from "./image-modal";
import type { RoomRedesignRequest, SmartCropRequest } from "@shared/schema";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

interface ImageCanvasProps {
  originalImage: string | null;
  generatedImage: string | null;
  generatedVariations?: string[];
  generationType?: "design" | "crop" | "dimensional" | null;
  originalFileName?: string;
  currentFormData?: RoomRedesignRequest;
  currentSmartCropData?: SmartCropRequest;
  referenceImages?: string[];
  batchStyleResults?: {style: string; image: string}[];
}

export function ImageCanvas({
  originalImage,
  generatedImage,
  generatedVariations = [],
  generationType = "design",
  originalFileName = "image",
  currentFormData,
  currentSmartCropData,
  referenceImages = [],
  batchStyleResults = [],
}: ImageCanvasProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [activeVariation, setActiveVariation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'slider'>('slider');

  // Helper to identify Dimensional jobs
  const isDimensional = generationType === 'dimensional';

  // Use active variation if selected, otherwise default generated image
  const currentDisplayImage = activeVariation || generatedImage;

  const openModal = (image: string, title: string) => {
    setModalImage(image);
    setModalTitle(title);
    setModalOpen(true);
  };

  const slugify = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') 
      .replace(/^-+|-+$/g, '');
  };

  const generateDownloadFileName = (): string => {
    const baseName = originalFileName?.replace(/\.[^/.]+$/, "") || "image";

    // [NEW] Logic for Dimensional Image Filenames
    if (isDimensional) {
        return `${baseName}-dimensional-ar-1-1`;
    }

    // [NEW] Logic for Smart Crop Filenames
    if (generationType === 'crop' && currentSmartCropData) {
        const fill = currentSmartCropData.fillRatio;
        const ar = slugify(currentSmartCropData.aspectRatio);
        return `${baseName}-crop-fill-${fill}-ar-${ar}`;
    }

    // Existing Logic for Design Filenames
    if (currentFormData) {
        const style = slugify(currentFormData.targetStyle);
        const quality = slugify(currentFormData.quality);
        const ar = slugify(currentFormData.aspectRatio);
        return `${baseName}-${style}-${quality}-ar-${ar}`;
    }

    return `redesign-${Date.now()}`;
  };

  const downloadImage = () => {
    if (!currentDisplayImage) return;
    let extension = "png";
    const mimeMatch = currentDisplayImage.match(/^data:image\/(\w+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      extension = mimeMatch[1] === "jpeg" ? "jpg" : mimeMatch[1];
    }
    const link = document.createElement("a");
    link.href = currentDisplayImage;
    link.download = `${generateDownloadFileName()}.${extension}`;
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

  // [UPDATED] Helper to determine if we show comparison tools (hide for crop AND dimensional)
  const showComparisonTools = currentDisplayImage && generationType !== 'crop' && !isDimensional;

  return (
    <>
      <div className="h-full p-6 flex flex-col gap-4">

        {/* Header Section */}
        <div className="flex-none flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {/* [UPDATED] Dynamic Title logic */}
            {generationType === 'crop' 
                ? "Smart Crop Result" 
                : isDimensional
                    ? "Dimensional Image Result"
                    : currentDisplayImage 
                        ? "Comparison Preview" 
                        : "Original Image"}
          </h3>

          <div className="flex gap-2">
             {/* [UPDATED] Only show Slider/Split if NOT crop mode and NOT dimensional */}
             {showComparisonTools && (
               <>
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
               </>
             )}

             {/* Download always visible if image exists */}
             {currentDisplayImage && (
                <Button size="icon" variant="ghost" onClick={downloadImage}>
                  <Download className="w-4 h-4" />
                </Button>
             )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 w-full min-h-0">
          <Card className="w-full h-full bg-muted/20 overflow-hidden relative border-2 border-border/50 flex items-center justify-center">
            {currentDisplayImage ? (
              // [UPDATED] Logic for Crop/Dimensional View vs Design View
              (generationType === 'crop' || isDimensional) ? (
                 // Simple Single Image View for Crops and Dimensional images
                 <div className="w-full h-full flex items-center justify-center p-4">
                    <img 
                      src={currentDisplayImage} 
                      className="max-w-full max-h-full object-contain shadow-lg rounded-sm cursor-pointer" 
                      alt={isDimensional ? "Dimensional Result" : "Smart Crop Result"}
                      onClick={() => openModal(currentDisplayImage, isDimensional ? "Dimensional Result" : "Smart Crop Result")}
                    />
                 </div>
              ) : (
                // Comparison View for Designs
                viewMode === 'slider' ? (
                  <div className="w-full h-full">
                    <ReactCompareSlider
                      itemOne={
                        <ReactCompareSliderImage 
                          src={originalImage} 
                          alt="Original" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                      }
                      itemTwo={
                        <ReactCompareSliderImage 
                          src={currentDisplayImage} 
                          alt="Generated" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                      }
                      className="w-full h-full"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 w-full h-full gap-1">
                    <div className="h-full bg-background flex items-center justify-center p-2 overflow-hidden">
                      <img 
                        src={originalImage} 
                        className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                        alt="Original"
                        onClick={() => openModal(originalImage, "Original Image")}
                      />
                    </div>
                    <div className="h-full bg-background flex items-center justify-center p-2 overflow-hidden">
                      <img 
                        src={currentDisplayImage} 
                        className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                        alt="Generated"
                        onClick={() => openModal(currentDisplayImage, "Generated Design")}
                      />
                    </div>
                  </div>
                )
              )
            ) : (
              // Fallback: Show Original only
              <div className="w-full h-full flex items-center justify-center p-4">
                <img 
                  src={originalImage} 
                  className="max-w-full max-h-full object-contain shadow-lg rounded-sm" 
                  alt="Original"
                />
              </div>
            )}
          </Card>
        </div>

        {/* Reference Images Section */}
        {referenceImages.length > 0 && (
          <div className="flex-none mt-2">
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Active References</h4>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {referenceImages.map((img, idx) => (
                <div key={idx} className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border border-border relative">
                  <img src={img} className="w-full h-full object-cover" alt={`Reference ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Batch Styles Grid */}
        {batchStyleResults.length > 0 && (
          <div className="flex-none mt-2">
            <h4 className="text-sm font-semibold mb-3">All Styles ({batchStyleResults.length})</h4>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 overflow-x-auto pb-2">
              {batchStyleResults.map((result, idx) => (
                <div 
                  key={idx}
                  className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all aspect-square relative group ${currentDisplayImage === result.image ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent hover:border-primary/30'}`}
                  onClick={() => setActiveVariation(result.image)}
                  title={result.style}
                >
                  <img src={result.image} className="w-full h-full object-cover" alt={result.style} />
                  <span className="absolute bottom-0 left-0 right-0 text-[9px] bg-black/70 text-white px-1 py-0.5 truncate text-center">
                    {result.style}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Batch Variations Thumbnails - Hide for Dimensional jobs and when batch styles are shown */}
        {batchStyleResults.length === 0 && (generatedVariations.length > 0 || generatedImage) && generationType === 'design' && !isDimensional && (
          <div className="flex-none mt-2">
            <h4 className="text-sm font-semibold mb-3">Variations</h4>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              <div 
                className="w-24 h-24 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 border-transparent hover:border-primary/50 relative group"
                onClick={() => setActiveVariation(null)} 
                title="Show Original"
              >
                <img src={originalImage} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">Orig</span>
              </div>

              {generatedImage && (
                <div 
                  className={`w-24 h-24 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all ${currentDisplayImage === generatedImage ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent hover:border-primary/30'}`}
                  onClick={() => setActiveVariation(generatedImage)}
                  title="Front View (Main)"
                >
                  <img src={generatedImage} className="w-full h-full object-cover" />
                </div>
              )}

              {generatedVariations.map((img, idx) => (
                <div 
                  key={idx}
                  className={`w-24 h-24 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all ${currentDisplayImage === img ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent hover:border-primary/30'}`}
                  onClick={() => setActiveVariation(img)}
                  title={`Variation ${idx + 1}`}
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