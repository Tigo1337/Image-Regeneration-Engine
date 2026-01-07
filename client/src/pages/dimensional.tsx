import { useState } from "react";
import { ImageUploadTabs } from "@/components/image-upload-tabs";
import { ControlPanel } from "@/components/control-panel";
import { ImageCanvas } from "@/components/image-canvas";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RoomRedesignRequest, RoomRedesignResponse, SmartCropRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Ruler } from "lucide-react";

export default function Dimensional() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("technical-source");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [generationType, setGenerationType] = useState<"design" | "crop" | null>(null);
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null);

  const [currentFormData, setCurrentFormData] = useState<RoomRedesignRequest | null>(null);
  const [currentSmartCropData, setCurrentSmartCropData] = useState<SmartCropRequest | null>(null);

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceDrawing, setReferenceDrawing] = useState<string | null>(null);
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImageLoad = (imageData: string, fileName?: string) => {
    setOriginalImage(imageData);
    if (fileName) setOriginalFileName(fileName);
    setGeneratedImage(null);
    setGenerationType(null); 
    setCropSourceImage(null); 
    setCurrentFormData(null);
    setCurrentSmartCropData(null);
    setReferenceImages([]); 
    setReferenceDrawing(null); 
    setSavedDesignId(null);
  };

  const generateMutation = useMutation({
    mutationFn: async (data: RoomRedesignRequest & { imageData: string; prompt: string; batchSize?: number }) => {
      const res = await apiRequest("POST", "/api/generate", data);
      return res.json() as Promise<RoomRedesignResponse>;
    },
    onSuccess: async (response) => {
      if (response.success && response.generatedImage) {
        setGeneratedImage(response.generatedImage);
        setGenerationType("design"); 

        if (originalImage && currentFormData) {
          try {
            const saveRes = await apiRequest("POST", "/api/gallery/save", {
              originalImage,
              generatedImage: response.generatedImage,
              originalFileName,
              config: currentFormData,
            });
            const savedData = await saveRes.json();
            if (savedData.success && savedData.design?.id) {
               setSavedDesignId(savedData.design.id);
            }
            queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
          } catch (error) {
            console.error("Failed to save to gallery:", error);
          }
        }

        toast({
          title: "Dimensional annotation complete!",
          description: "Technical view generated successfully.",
        });
      }
    }
  });

  const smartCropMutation = useMutation({
    mutationFn: async (data: SmartCropRequest & { imageData: string }) => {
        const res = await apiRequest("POST", "/api/smart-crop", data);
        return res.json();
    },
    onSuccess: (response) => {
        if (response.success && response.generatedImage) {
            setGeneratedImage(response.generatedImage);
            setGenerationType("crop"); 
            toast({ title: "Crop Complete", description: "Product centered." });
        }
    }
  });

  const handleGenerate = (formData: RoomRedesignRequest, prompt: string) => {
    if (!originalImage || !prompt) return;

    const requestData = {
      ...formData,
      promptType: "dimensional" as const, // Force dimensional
      referenceImages: referenceImages,
      referenceDrawing: referenceDrawing || undefined,
    };

    setCurrentFormData(requestData as RoomRedesignRequest);
    generateMutation.mutate({ ...requestData, imageData: originalImage, prompt });
  };

  const handleSmartCrop = (data: SmartCropRequest) => {
      setCurrentSmartCropData(data);
      const source = generatedImage || originalImage;
      if (!source) return;
      smartCropMutation.mutate({ ...data, imageData: source });
  };

  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setGenerationType(null);
    setReferenceImages([]);
    setReferenceDrawing(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-96 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-card-border">
          <div className="flex items-center gap-3">
            <Ruler className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Dimensional tool</h1>
              <p className="text-xs text-muted-foreground">Technical Product Annotations</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {generatedImage ? (
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm"
              >
                ← Back to Upload
              </button>
            ) : (
              <ImageUploadTabs onImageLoad={handleImageLoad} />
            )}

            <ControlPanel 
              onGenerate={handleGenerate}
              onSmartCrop={handleSmartCrop} 
              disabled={!originalImage}
              isGenerating={generateMutation.isPending || smartCropMutation.isPending}
              referenceImages={referenceImages}
              onReferenceImagesChange={setReferenceImages}
              referenceDrawing={referenceDrawing}
              onReferenceDrawingChange={setReferenceDrawing}
            />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <ImageCanvas 
          originalImage={originalImage}
          generatedImage={generatedImage}
          generationType={generationType}
          originalFileName={originalFileName}
          currentFormData={currentFormData || undefined}
          currentSmartCropData={currentSmartCropData || undefined}
          referenceImages={referenceImages}
        />
      </main>

      {(generateMutation.isPending || smartCropMutation.isPending) && <LoadingOverlay />}
    </div>
  );
}