import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Maximize, Download } from "lucide-react";
import { ImageModal } from "./image-modal";
import type { RoomRedesignRequest } from "@shared/schema";

interface ImageCanvasProps {
  originalImage: string | null;
  generatedImage: string | null;
  originalFileName?: string;
  currentFormData?: RoomRedesignRequest;
}

export function ImageCanvas({
  originalImage,
  generatedImage,
  originalFileName = "image",
  currentFormData,
}: ImageCanvasProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");

  const openModal = (image: string, title: string) => {
    setModalImage(image);
    setModalTitle(title);
    setModalOpen(true);
  };

  const generateDownloadFileName = (): string => {
    if (!currentFormData) return originalFileName;

    // Convert to lowercase and replace spaces/special chars with hyphens
    const baseName = originalFileName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const style = currentFormData.targetStyle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const quality = currentFormData.quality
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const aspectRatio = currentFormData.aspectRatio
      .toLowerCase()
      .replace(/:/g, "-")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/^-|-$/g, "");

    const arFormatted = currentFormData.aspectRatio === "Original" 
      ? "original" 
      : `ar-${aspectRatio}`;

    return `${baseName}-${style}-${quality}-${arFormatted}`;
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
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
            Upload an image or paste a URL from the sidebar to begin redesigning your room with AI
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full p-8 overflow-auto">
        <div
          className={`grid gap-6 ${generatedImage ? "grid-cols-2" : "grid-cols-1"}`}
          style={{ minHeight: "100%" }}
        >
          {/* Original Image */}
          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Original</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openModal(originalImage, "Original Image")}
                data-testid="button-view-original"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
            <Card className="flex-1 overflow-auto flex items-center justify-center bg-muted/20 min-h-0 cursor-pointer hover-elevate transition-all"
              onClick={() => openModal(originalImage, "Original Image")}
            >
              <div className="flex items-center justify-center w-full h-full max-h-96">
                <img
                  src={originalImage}
                  alt="Original room"
                  className="max-w-full max-h-full object-contain"
                  data-testid="img-original"
                />
              </div>
            </Card>
          </div>

          {/* Generated Image */}
          {generatedImage && (
            <div className="flex flex-col gap-4 min-h-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  AI Generated
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openModal(generatedImage, "AI Generated Image")}
                    data-testid="button-view-generated"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={downloadImage}
                    data-testid="button-download-generated"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Card className="flex-1 overflow-auto flex items-center justify-center bg-muted/20 min-h-0 cursor-pointer hover-elevate transition-all"
                onClick={() => openModal(generatedImage, "AI Generated Image")}
              >
                <div className="flex items-center justify-center w-full h-full max-h-96">
                  <img
                    src={generatedImage}
                    alt="AI-generated room design"
                    className="max-w-full max-h-full object-contain"
                    data-testid="img-generated"
                  />
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={modalImage || ""}
        imageAlt={modalTitle}
        downloadFileName={
          modalImage === generatedImage
            ? generateDownloadFileName()
            : undefined
        }
        onDownload={modalImage === generatedImage ? downloadImage : undefined}
      />
    </>
  );
}
