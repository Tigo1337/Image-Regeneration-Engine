import { useState } from "react";
import { ImageUploadTabs } from "@/components/image-upload-tabs";
import { ControlPanel } from "@/components/control-panel";
import { ImageCanvas } from "@/components/image-canvas";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RoomRedesignRequest, RoomRedesignResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("image");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [modificationPrompt, setModificationPrompt] = useState<string>("");
  const [currentFormData, setCurrentFormData] = useState<RoomRedesignRequest | null>(null);

  // Lifted state for reference images
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  // [NEW] Lifted state for technical drawing
  const [referenceDrawing, setReferenceDrawing] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImageLoad = (imageData: string, fileName?: string) => {
    setOriginalImage(imageData);
    if (fileName) {
      setOriginalFileName(fileName);
    }
    setGeneratedImage(null);
    setGeneratedVariations([]);
    setModificationPrompt("");
    setReferenceImages([]); 
    setReferenceDrawing(null); // Reset drawing
  };

  const generateMutation = useMutation({
    mutationFn: async (data: RoomRedesignRequest & { imageData: string; referenceImage?: string; prompt: string; isModification?: boolean; batchSize?: number }) => {
      const endpoint = data.isModification ? "/api/modify" : "/api/generate";
      const res = await apiRequest(
        "POST",
        endpoint,
        data
      );
      return res.json() as Promise<RoomRedesignResponse & { variations?: string[] }>;
    },
    onSuccess: async (response) => {
      if (response.success && response.generatedImage) {
        setGeneratedImage(response.generatedImage);

        if (response.variations && response.variations.length > 0) {
          setGeneratedVariations(response.variations);
        } else {
          setGeneratedVariations([]);
        }

        setModificationPrompt("");

        if (originalImage && currentFormData) {
          try {
            await apiRequest("POST", "/api/gallery/save", {
              originalImage,
              generatedImage: response.generatedImage,
              originalFileName,
              config: currentFormData,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
          } catch (error) {
            console.error("Failed to save design to gallery:", error);
          }
        }

        toast({
          title: response.variations?.length ? "Variations Generated!" : "Room redesigned successfully!",
          description: response.variations?.length ? "Created 4 different views." : "Your AI-generated design is ready.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Generation failed",
          description: response.error || "Failed to generate room design",
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate design",
      });
    },
  });

  const handleGenerate = (formData: RoomRedesignRequest, prompt: string, batchSize: number = 1) => {
    if (!originalImage) {
      toast({
        variant: "destructive",
        title: "Missing image",
        description: "Please upload an image first",
      });
      return;
    }

    if (!prompt) {
      toast({
        variant: "destructive",
        title: "Missing prompt",
        description: "Please provide a prompt",
      });
      return;
    }

    // [NEW] Include drawing in request
    const requestData = {
      ...formData,
      referenceImages: referenceImages,
      referenceDrawing: referenceDrawing || undefined
    };

    setCurrentFormData(requestData as RoomRedesignRequest);

    if (generatedImage) {
      generateMutation.mutate({
        ...requestData,
        imageData: originalImage,
        referenceImage: generatedImage,
        prompt: prompt,
        isModification: true,
        batchSize: 1 
      });
    } else {
      generateMutation.mutate({
        ...requestData,
        imageData: originalImage,
        prompt: prompt,
        isModification: false,
        batchSize: batchSize, 
      });
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setOriginalFileName("image");
    setGeneratedImage(null);
    setGeneratedVariations([]);
    setModificationPrompt("");
    setCurrentFormData(null);
    setReferenceImages([]);
    setReferenceDrawing(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-96 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-card-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">RoomReimagine AI</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Interior Design</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {generatedImage ? (
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover-elevate font-medium text-sm"
                data-testid="button-back-to-home"
              >
                ← Back to Home
              </button>
            ) : (
              <ImageUploadTabs onImageLoad={handleImageLoad} />
            )}
            <ControlPanel 
              onGenerate={handleGenerate}
              disabled={!originalImage}
              isGenerating={generateMutation.isPending}
              isModificationMode={!!generatedImage}
              modificationPrompt={modificationPrompt}
              onModificationPromptChange={setModificationPrompt}
              referenceImages={referenceImages}
              onReferenceImagesChange={setReferenceImages}
              // [NEW] Pass drawing state
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
          generatedVariations={generatedVariations}
          originalFileName={originalFileName}
          currentFormData={currentFormData || undefined}
          referenceImages={referenceImages}
        />
      </main>

      {generateMutation.isPending && <LoadingOverlay />}
    </div>
  );
}