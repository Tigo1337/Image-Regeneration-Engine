import { Card } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

interface ImageCanvasProps {
  originalImage: string | null;
  generatedImage: string | null;
}

export function ImageCanvas({ originalImage, generatedImage }: ImageCanvasProps) {
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
    <div className="h-full p-8">
      <div className={`grid gap-6 h-full ${generatedImage ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Original Image */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Original</h3>
          </div>
          <Card className="flex-1 overflow-hidden flex items-center justify-center bg-muted/20">
            <img
              src={originalImage}
              alt="Original room"
              className="max-w-full max-h-full object-contain"
              data-testid="img-original"
            />
          </Card>
        </div>

        {/* Generated Image */}
        {generatedImage && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">AI Generated</h3>
            </div>
            <Card className="flex-1 overflow-hidden flex items-center justify-center bg-muted/20">
              <img
                src={generatedImage}
                alt="AI-generated room design"
                className="max-w-full max-h-full object-contain"
                data-testid="img-generated"
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
