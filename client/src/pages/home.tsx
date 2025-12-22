import { useState } from "react";
import { ImageUploadTabs } from "@/components/image-upload-tabs";
import { ControlPanel } from "@/components/control-panel";
import { ImageCanvas } from "@/components/image-canvas";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RoomRedesignRequest, RoomRedesignResponse, SmartCropRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("image");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Track what kind of generation produced the current result
  const [generationType, setGenerationType] = useState<"design" | "crop" | null>(null);
  // Store the source for cropping so we don't crop the crop recursively
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null);

  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [modificationPrompt, setModificationPrompt] = useState<string>("");

  // Track request data for file naming
  const [currentFormData, setCurrentFormData] = useState<RoomRedesignRequest | null>(null);
  // [NEW] Track Smart Crop data for file naming
  const [currentSmartCropData, setCurrentSmartCropData] = useState<SmartCropRequest | null>(null);

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceDrawing, setReferenceDrawing] = useState<string | null>(null);
  const [structureAnalysis, setStructureAnalysis] = useState<string | null>(null);
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImageLoad = (imageData: string, fileName?: string) => {
    setOriginalImage(imageData);
    if (fileName) {
      setOriginalFileName(fileName);
    }
    setGeneratedImage(null);
    setGenerationType(null); 
    setCropSourceImage(null); 
    setGeneratedVariations([]);
    setModificationPrompt("");
    setCurrentFormData(null); // Reset design data
    setCurrentSmartCropData(null); // [NEW] Reset crop data
    setReferenceImages([]); 
    setReferenceDrawing(null); 
    setStructureAnalysis(null); 
    setSavedDesignId(null);
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
        setGenerationType("design"); 
        setCropSourceImage(null); 

        if (response.structureAnalysis) {
            setStructureAnalysis(response.structureAnalysis);
        }

        setGeneratedVariations([]); 
        setModificationPrompt("");

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
            console.error("Failed to save design to gallery:", error);
          }
        }

        toast({
          title: "Room redesigned successfully!",
          description: "Your AI-generated design is ready. You can now generate perspectives.",
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

  const variationsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/variations", data);
      return res.json();
    },
    onSuccess: async (response) => {
      if (response.success && response.variations) {
        setGeneratedVariations(response.variations);

        if (savedDesignId) {
            try {
                await apiRequest("POST", "/api/gallery/update", {
                    id: savedDesignId,
                    variations: response.variations
                });
                toast({ title: "Gallery Updated", description: "Variations saved to gallery." });
            } catch(e) {
                console.error("Failed to save variations:", e);
            }
        }

        toast({
          title: "Perspectives Generated!",
          description: `Created ${response.variations.length} new views.`,
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Variation Error",
        description: "Failed to generate perspectives.",
      });
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
            toast({
                title: "Smart Crop Complete",
                description: "Image has been cropped to center your object.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Crop Failed",
                description: response.error || "Could not detect object.",
            });
        }
    },
    onError: (error) => {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process smart crop.",
        });
    }
  });

  const handleGenerate = (formData: RoomRedesignRequest, prompt: string, batchSize: number = 1) => {
    if (!originalImage) {
      toast({ variant: "destructive", title: "Missing image", description: "Please upload an image first" });
      return;
    }
    if (!prompt) {
      toast({ variant: "destructive", title: "Missing prompt", description: "Please provide a prompt" });
      return;
    }

    const requestData = {
      ...formData,
      referenceImages: referenceImages,
      referenceDrawing: referenceDrawing || undefined,
      structureAnalysis: structureAnalysis || undefined 
    };

    setCurrentFormData(requestData as RoomRedesignRequest);

    if (generatedImage && generationType !== 'crop') {
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
        batchSize: 1, 
      });
    }
  };

  const handleGenerateVariations = (selectedVariations: string[]) => {
    if (!generatedImage || !currentFormData) return;

    variationsMutation.mutate({
      ...currentFormData, 
      imageData: generatedImage, 
      prompt: "Generate variations", 
      selectedVariations, 
      structureAnalysis: structureAnalysis || undefined, 
    });
  };

  const handleSmartCrop = (data: SmartCropRequest) => {
      // Save data for file naming
      setCurrentSmartCropData(data);

      let source = cropSourceImage;

      if (generationType !== 'crop') {
          source = generatedImage || originalImage;
          setCropSourceImage(source);
      }

      if (!source) source = originalImage;

      if (!source) {
          toast({ variant: "destructive", title: "No image", description: "No image to crop." });
          return;
      }

      smartCropMutation.mutate({
          ...data,
          imageData: source
      });
  };

  const handleReset = () => {
    setOriginalImage(null);
    setOriginalFileName("image");
    setGeneratedImage(null);
    setGenerationType(null);
    setCropSourceImage(null);
    setGeneratedVariations([]);
    setModificationPrompt("");
    setCurrentFormData(null);
    setCurrentSmartCropData(null);
    setReferenceImages([]);
    setReferenceDrawing(null);
    setStructureAnalysis(null);
    setSavedDesignId(null);
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
              onGenerateVariations={handleGenerateVariations}
              onSmartCrop={handleSmartCrop} 
              disabled={!originalImage}
              isGenerating={generateMutation.isPending || variationsMutation.isPending || smartCropMutation.isPending}
              isModificationMode={!!generatedImage && generationType === "design"}
              modificationPrompt={modificationPrompt}
              onModificationPromptChange={setModificationPrompt}
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
          generationType={generationType} // [NEW] Pass generation type
          generatedVariations={generatedVariations}
          originalFileName={originalFileName}
          currentFormData={currentFormData || undefined}
          currentSmartCropData={currentSmartCropData || undefined} // [NEW] Pass crop data
          referenceImages={referenceImages}
        />
      </main>

      {(generateMutation.isPending || variationsMutation.isPending || smartCropMutation.isPending) && <LoadingOverlay />}
    </div>
  );
}