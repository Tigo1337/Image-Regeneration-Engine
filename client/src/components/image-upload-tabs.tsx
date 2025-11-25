import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

interface ImageUploadTabsProps {
  onImageLoad: (imageData: string, fileName?: string) => void;
}

export function ImageUploadTabs({ onImageLoad }: ImageUploadTabsProps) {
  const [cloudinaryUrl, setCloudinaryUrl] = useState("");
  const { toast } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove file extension for the base name
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          onImageLoad(result, nameWithoutExt);
          toast({
            title: "Image uploaded",
            description: `${file.name} loaded successfully`,
          });
        };
        reader.readAsDataURL(file);
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

    try {
      const response = await fetch(cloudinaryUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onImageLoad(result, "uploaded-image");
        toast({
          title: "Image loaded",
          description: "Image from URL loaded successfully",
        });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load image",
        description: "Could not load image from the provided URL",
      });
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
              border-2 border-dashed cursor-pointer transition-colors
              hover-elevate active-elevate-2
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
            `}
            data-testid="dropzone-upload"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center p-8 text-center">
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
                PNG, JPG, JPEG, WebP
              </p>
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
            <p className="text-xs text-muted-foreground">
              Paste a Cloudinary URL or any public image URL
            </p>
          </div>
          <Button 
            onClick={handleUrlSubmit} 
            className="w-full"
            data-testid="button-load-url"
          >
            Load Image
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
