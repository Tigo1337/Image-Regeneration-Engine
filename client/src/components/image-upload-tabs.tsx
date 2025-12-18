import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

interface ImageUploadTabsProps {
  onImageLoad: (imageData: string, fileName?: string) => void;
}

export function ImageUploadTabs({ onImageLoad }: ImageUploadTabsProps) {
  const [cloudinaryUrl, setCloudinaryUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 2048; // Gemini limit

          if (width > height && width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          } else if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setIsProcessing(true);
        try {
          const file = acceptedFiles[0];
          const resizedDataUrl = await resizeImage(file);

          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          onImageLoad(resizedDataUrl, nameWithoutExt);
          toast({
            title: "Image processed",
            description: `${file.name} optimized and loaded successfully`,
          });
        } catch (error) {
          console.error(error);
          toast({
            variant: "destructive",
            title: "Processing failed",
            description: "Could not optimize image. Please try another.",
          });
        } finally {
          setIsProcessing(false);
        }
      }
    },
    onDropRejected: () => {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a valid image file (PNG, JPG, JPEG, WebP)",
      });
    }
  });

  const handleUrlSubmit = async () => {
    if (!cloudinaryUrl.trim()) {
      toast({
        variant: "destructive",
        title: "No URL provided",
        description: "Please enter a valid image URL",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Proxy through backend in a real app to avoid CORS, 
      // but here we try direct fetch if CORS allows
      const response = await fetch(cloudinaryUrl);
      const blob = await response.blob();
      const file = new File([blob], "url-image.jpg", { type: blob.type });
      const resizedDataUrl = await resizeImage(file);

      onImageLoad(resizedDataUrl, "url-image");
      toast({
        title: "Image loaded",
        description: "Image from URL optimized successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load image",
        description: "Could not load or process image from URL (CORS might be blocking it)",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-card-foreground">Image Input</Label>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" data-testid="tab-upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" data-testid="tab-url">
            <LinkIcon className="w-4 h-4 mr-2" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <Card
            {...getRootProps()}
            className={`
              border-2 border-dashed cursor-pointer transition-colors relative
              hover-elevate active-elevate-2
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
            `}
            data-testid="dropzone-upload"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center p-8 text-center">
              {isProcessing ? (
                <div className="flex flex-col items-center animate-in fade-in">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">Optimizing...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-muted">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="mb-1 text-sm font-medium text-card-foreground">
                    {isDragActive ? "Drop image here" : "Drag & drop an image"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Auto-optimized for AI (Max 2048px)
                  </p>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cloudinary-url" className="text-sm">
              Image URL
            </Label>
            <Input
              id="cloudinary-url"
              type="url"
              placeholder="https://res.cloudinary.com/..."
              value={cloudinaryUrl}
              onChange={(e) => setCloudinaryUrl(e.target.value)}
              data-testid="input-cloudinary-url"
            />
          </div>
          <Button 
            onClick={handleUrlSubmit} 
            className="w-full"
            disabled={isProcessing}
            data-testid="button-load-url"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Load Image"
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}