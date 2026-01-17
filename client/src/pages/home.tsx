import { useState } from "react";
import { ImageUploadTabs } from "@/components/image-upload-tabs";
import { ControlPanel } from "@/components/control-panel";
import { ImageCanvas } from "@/components/image-canvas";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RoomRedesignRequest, RoomRedesignResponse, SmartCropRequest, DimensionalImageRequest } from "@shared/schema";
import { availableStyles } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { styleDescriptions, constructPrompt, type PromptType } from "@/lib/prompt-builder";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("image");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Track what kind of generation produced the current result
  const [generationType, setGenerationType] = useState<"design" | "crop" | "dimensional" | null>(null);
  // Store the source for cropping so we don't crop the crop recursively
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null);

  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [modificationPrompt, setModificationPrompt] = useState<string>("");
  const [batchStyleResults, setBatchStyleResults] = useState<{style: string; image: string}[]>([]);

  // Track request data for file naming
  const [currentFormData, setCurrentFormData] = useState<RoomRedesignRequest | null>(null);
  // Track Smart Crop data for file naming
  const [currentSmartCropData, setCurrentSmartCropData] = useState<SmartCropRequest | null>(null);
  // Track Dimensional data for file naming
  const [currentDimensionalData, setCurrentDimensionalData] = useState<DimensionalImageRequest | null>(null);

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [inspirationImages, setInspirationImages] = useState<string[]>([]);
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
    setCurrentFormData(null);
    setCurrentSmartCropData(null);
    setCurrentDimensionalData(null);
    setReferenceImages([]); 
    setInspirationImages([]);
    setReferenceDrawing(null); 
    setStructureAnalysis(null); 
    setSavedDesignId(null);
  };

  const generateMutation = useMutation({
    mutationFn: async (data: RoomRedesignRequest & { imageData: string; referenceImage?: string; prompt: string; isModification?: boolean }) => {
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

        // [UPDATED] If multiple images were generated, treat the extras as variations for the slider
        if (response.allImages && response.allImages.length > 1) {
            setGeneratedVariations(response.allImages.slice(1));
        } else {
            setGeneratedVariations([]); 
        }

        setModificationPrompt("");

        // Server now handles saving to gallery automatically for batch and single generations
        queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });

        toast({
          title: response.allImages && response.allImages.length > 1 
            ? `Batch of ${response.allImages.length} designs ready!` 
            : "Room redesigned successfully!",
          description: "Your AI-generated design is saved in the gallery.",
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

  const dimensionalMutation = useMutation({
    mutationFn: async (data: DimensionalImageRequest & { imageData: string }) => {
        const res = await apiRequest("POST", "/api/generate-dimensional", data);
        return res.json();
    },
    onSuccess: (response) => {
        if (response.success && response.generatedImage) {
            setGeneratedImage(response.generatedImage);
            setGenerationType("dimensional"); 
            toast({
                title: "Dimensional Image Generated",
                description: "Technical annotations have been added to your product photo.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Generation Failed",
                description: response.error || "Could not generate dimensional image.",
            });
        }
    },
    onError: (error) => {
        toast({
            variant: "destructive",
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to generate dimensional image.",
        });
    }
  });

  const batchStylesMutation = useMutation({
    mutationFn: async (data: { imageData: string; formData: RoomRedesignRequest; styles: string[] }) => {
      const res = await apiRequest("POST", "/api/generate/batch-styles", data);
      return res.json() as Promise<{ success: boolean; results: {style: string; image: string; error?: string}[]; error?: string }>;
    },
    onSuccess: async (response) => {
      if (response.success && response.results) {
        const successfulResults = response.results.filter(r => r.image);
        setBatchStyleResults(successfulResults);
        setGeneratedVariations([]);

        if (successfulResults.length > 0) {
          setGeneratedImage(successfulResults[0].image);
          setGenerationType("design");
        }

        const failedCount = response.results.length - successfulResults.length;
        const failedStyles = response.results.filter(r => !r.image).map(r => r.style);

        toast({
          title: `Batch Generation Complete`,
          description: failedCount > 0 
            ? `Generated ${successfulResults.length} styles and saved to gallery. Failed: ${failedStyles.join(', ')}`
            : `Generated ${successfulResults.length} styles and saved to gallery.`,
          variant: failedCount > 0 ? "default" : "default",
        });

        queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      } else {
        toast({
          variant: "destructive",
          title: "Batch Generation Failed",
          description: response.error || "Failed to generate styles",
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate batch styles",
      });
    },
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
      batchSize: batchSize,
      originalFileName: originalFileName,
      referenceImages: referenceImages,
      inspirationImages: inspirationImages,
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
        isModification: true
      });
    } else {
      generateMutation.mutate({
        ...requestData,
        imageData: originalImage,
        prompt: prompt,
        isModification: false
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

  const handleGenerateDimensional = (data: DimensionalImageRequest) => {
      if (!originalImage) {
          toast({ variant: "destructive", title: "No image", description: "Please upload an image first." });
          return;
      }

      setCurrentDimensionalData(data);

      dimensionalMutation.mutate({
          ...data,
          imageData: originalImage
      });
  };

  const handleGenerateBatchStyles = (formData: RoomRedesignRequest, _prompt: string) => {
    if (!originalImage) {
      toast({ variant: "destructive", title: "Missing image", description: "Please upload an image first" });
      return;
    }

    setBatchStyleResults([]);
    setCurrentFormData({ ...formData, originalFileName });

    batchStylesMutation.mutate({
      imageData: originalImage,
      formData: { ...formData, originalFileName, inspirationImages },
      styles: [...availableStyles],
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
    setBatchStyleResults([]);
    setCurrentFormData(null);
    setCurrentSmartCropData(null);
    setCurrentDimensionalData(null);
    setReferenceImages([]);
    setInspirationImages([]);
    setReferenceDrawing(null);
    setStructureAnalysis(null);
    setSavedDesignId(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-96 border-r border-border bg-card flex flex-col">
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
              onGenerateBatchStyles={handleGenerateBatchStyles}
              onSmartCrop={handleSmartCrop}
              onGenerateDimensional={handleGenerateDimensional}
              disabled={!originalImage}
              isGenerating={generateMutation.isPending || variationsMutation.isPending || smartCropMutation.isPending || dimensionalMutation.isPending || batchStylesMutation.isPending}
              isModificationMode={!!generatedImage && generationType === "design"}
              modificationPrompt={modificationPrompt}
              onModificationPromptChange={setModificationPrompt}
              referenceImages={referenceImages}
              onReferenceImagesChange={setReferenceImages}
              inspirationImages={inspirationImages}
              onInspirationImagesChange={setInspirationImages}
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
          generatedVariations={generatedVariations}
          originalFileName={originalFileName}
          currentFormData={currentFormData || undefined}
          currentSmartCropData={currentSmartCropData || undefined}
          referenceImages={referenceImages}
          batchStyleResults={batchStyleResults}
        />
      </main>

      {(generateMutation.isPending || variationsMutation.isPending || smartCropMutation.isPending || dimensionalMutation.isPending || batchStylesMutation.isPending) && <LoadingOverlay />}
    </div>
  );
}