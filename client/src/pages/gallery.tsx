import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Maximize, ArrowLeft, Layers } from "lucide-react";
import { Link } from "wouter";
import { ImageModal } from "@/components/image-modal";
import type { GeneratedDesign, RoomRedesignRequest } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface DesignWithConfig extends Omit<GeneratedDesign, 'config'> {
  config: RoomRedesignRequest;
}

export default function Gallery() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [selectedDesign, setSelectedDesign] = useState<DesignWithConfig | null>(null);

  const { data: designs = [], isLoading } = useQuery<DesignWithConfig[]>({
    queryKey: ["/api/gallery"],
  });

  const openModal = (image: string, title: string, design: DesignWithConfig) => {
    setModalImage(image);
    setModalTitle(title);
    setSelectedDesign(design);
    setModalOpen(true);
  };

  const downloadImage = (design: DesignWithConfig) => {
    const baseName = design.originalFileName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const style = design.config.targetStyle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const quality = design.config.quality
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const arFormatted = design.config.aspectRatio === "Original"
      ? "original"
      : `ar-${design.config.aspectRatio.toLowerCase().replace(/:/g, "-")}`;

    const link = document.createElement("a");
    link.href = design.generatedImageUrl;
    link.download = `${baseName}-${style}-${quality}-${arFormatted}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-gallery">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Design History</h1>
            <p className="text-muted-foreground">View and download your generated designs</p>
          </div>
        </div>

        {designs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No designs generated yet. Create your first design on the home page!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => {
              // Ensure variations is always an array
              const variations = (design.variations as string[]) || [];

              return (
                <Card key={design.id} className="overflow-hidden hover-elevate transition-all flex flex-col h-full">
                  <div className="aspect-video bg-muted/20 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                    onClick={() => openModal(design.generatedImageUrl, "Generated Design", design)}
                  >
                    <img
                      src={design.generatedImageUrl}
                      alt={`Design for ${design.originalFileName}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      data-testid={`img-gallery-design-${design.id}`}
                    />
                    {variations.length > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                          <Layers className="w-3 h-3" />
                          +{variations.length}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">File</p>
                      <p className="text-sm font-medium text-foreground line-clamp-1">{design.originalFileName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Style</p>
                        <p className="font-medium text-foreground">{design.config.targetStyle}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quality</p>
                        <p className="font-medium text-foreground">{design.config.quality}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Aspect Ratio</p>
                        <p className="font-medium text-foreground">{design.config.aspectRatio}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Creativity</p>
                        <p className="font-medium text-foreground">{design.config.creativityLevel}%</p>
                      </div>
                    </div>

                    <div className="flex-1"></div>

                    {/* NEW: Variations Button (Only if variations exist) */}
                    {variations.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm" className="w-full mb-2 border border-border/50">
                            <Layers className="w-3 h-3 mr-2" />
                            View {variations.length} Variations
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Design Variations: {design.originalFileName}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="flex-1 pr-4 -mr-4">
                            <div className="space-y-6 p-1">
                              {/* Main Design Section in Dialog */}
                              <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Original Generation</h3>
                                <AspectRatio ratio={16/9} className="bg-muted rounded-md overflow-hidden border border-border">
                                  <img 
                                    src={design.generatedImageUrl} 
                                    className="object-cover w-full h-full"
                                    alt="Main Design" 
                                  />
                                </AspectRatio>
                              </div>

                              {/* Variations Grid */}
                              <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Perspective Variations</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {variations.map((vUrl, idx) => (
                                    <div key={idx} className="group relative rounded-md overflow-hidden border border-border bg-muted">
                                      <AspectRatio ratio={16/9}>
                                        <img 
                                          src={vUrl} 
                                          className="object-cover w-full h-full" 
                                          alt={`Variation ${idx + 1}`} 
                                        />
                                      </AspectRatio>

                                      {/* Variation Actions Overlay */}
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => openModal(vUrl, `Variation ${idx + 1}`, design)}>
                                          <Maximize className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" asChild>
                                          <a href={vUrl} download={`variation-${design.id}-${idx + 1}.png`}>
                                            <Download className="h-4 w-4" />
                                          </a>
                                        </Button>
                                      </div>
                                      <div className="absolute top-2 left-2 pointer-events-none">
                                        <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md">
                                          #{idx + 1}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openModal(design.generatedImageUrl, "Generated Design", design)}
                        data-testid={`button-view-design-${design.id}`}
                      >
                        <Maximize className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => downloadImage(design)}
                        data-testid={`button-download-design-${design.id}`}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={modalImage || ""}
        imageAlt={modalTitle}
        downloadFileName={
          selectedDesign
            ? (() => {
                const baseName = selectedDesign.originalFileName
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");
                const style = selectedDesign.config.targetStyle
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");
                const quality = selectedDesign.config.quality
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");
                const arFormatted = selectedDesign.config.aspectRatio === "Original"
                  ? "original"
                  : `ar-${selectedDesign.config.aspectRatio.toLowerCase().replace(/:/g, "-")}`;
                return `${baseName}-${style}-${quality}-${arFormatted}`;
              })()
            : undefined
        }
        onDownload={selectedDesign ? () => downloadImage(selectedDesign) : undefined}
      />
    </div>
  );
}