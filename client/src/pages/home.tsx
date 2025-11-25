import { useState } from "react";
import { ImageUploadTabs } from "@/components/image-upload-tabs";
import { ControlPanel } from "@/components/control-panel";
import { ImageCanvas } from "@/components/image-canvas";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RoomRedesignRequest, RoomRedesignResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("image");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [manualPrompt, setManualPrompt] = useState<string>("");
  const [currentFormData, setCurrentFormData] = useState<RoomRedesignRequest | null>(null);
  const { toast } = useToast();

  const handleImageLoad = (imageData: string, fileName?: string) => {
    setOriginalImage(imageData);
    if (fileName) {
      setOriginalFileName(fileName);
    }
  };

  const generateMutation = useMutation({
    mutationFn: async (data: RoomRedesignRequest & { imageData: string; referenceImage?: string; prompt: string; isModification?: boolean }) => {
      const endpoint = data.isModification ? "/api/modify" : "/api/generate";
      const res = await apiRequest(
        "POST",
        endpoint,
        data
      );
      return res.json() as Promise<RoomRedesignResponse>;
    },
    onSuccess: (response) => {
      if (response.success && response.generatedImage) {
        setGeneratedImage(response.generatedImage);
        setManualPrompt("");
        toast({
          title: generatedImage ? "Modification applied successfully!" : "Room redesigned successfully!",
          description: generatedImage ? "Your modifications have been applied." : "Your AI-generated design is ready.",
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

  const handleGenerate = (formData: RoomRedesignRequest) => {
    if (!originalImage || !manualPrompt) {
      toast({
        variant: "destructive",
        title: "Missing data",
        description: "Please upload an image and provide a prompt",
      });
      return;
    }

    setCurrentFormData(formData);

    if (generatedImage) {
      // Modification mode - use generated image as reference
      generateMutation.mutate({
        ...formData,
        imageData: originalImage,
        referenceImage: generatedImage,
        prompt: manualPrompt,
        isModification: true,
      });
    } else {
      // First generation mode - use original image
      generateMutation.mutate({
        ...formData,
        imageData: originalImage,
        prompt: manualPrompt,
        isModification: false,
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
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
            <ImageUploadTabs onImageLoad={handleImageLoad} />
            <ControlPanel 
              onGenerate={handleGenerate}
              disabled={!originalImage}
              isGenerating={generateMutation.isPending}
              manualPrompt={manualPrompt}
              onManualPromptChange={setManualPrompt}
              isModificationMode={!!generatedImage}
            />
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 overflow-auto">
        <ImageCanvas 
          originalImage={originalImage}
          generatedImage={generatedImage}
          originalFileName={originalFileName}
          currentFormData={currentFormData || undefined}
        />
      </main>

      {/* Loading Overlay */}
      {generateMutation.isPending && <LoadingOverlay />}
    </div>
  );
}
