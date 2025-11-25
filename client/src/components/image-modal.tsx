import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  downloadFileName?: string;
  onDownload?: () => void;
}

export function ImageModal({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  downloadFileName,
  onDownload,
}: ImageModalProps) {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    // Fallback download if no handler provided
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = downloadFileName || "image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden p-0">
        <div className="relative w-full h-full flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-background/80 rounded-full p-2 hover:bg-background"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {downloadFileName && (
            <div className="bg-background border-t border-border p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground truncate">
                {downloadFileName}.png
              </span>
              <Button
                onClick={handleDownload}
                size="sm"
                data-testid="button-download-image"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
