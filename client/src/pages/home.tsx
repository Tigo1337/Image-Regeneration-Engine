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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string | null>(null);
  const { toast } = useToast();

  const promptMutation = useMutation({
    mutationFn: async (data: RoomRedesignRequest & { imageData: string }) => {
      return await apiRequest<{ success: boolean; prompt?: string; error?: string }>(
        "POST",
        "/api/generate-prompt",
        data
      );
    },
    onSuccess: (response) => {
      if (response.success && response.prompt) {
        setGeneratedPrompt(response.prompt);
        setEditedPrompt(response.prompt);
        toast({
          title: "Prompt generated!",
          description: "Review and edit the prompt if needed, then generate the redesign.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Prompt generation failed",
          description: response.error || "Failed to generate prompt",
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate prompt",
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: RoomRedesignRequest & { imageData: string; prompt: string }) => {
      return await apiRequest<RoomRedesignResponse>(
        "POST",
        "/api/generate",
        data
      );
    },
    onSuccess: (response) => {
      if (response.success && response.generatedImage) {
        setGeneratedImage(response.generatedImage);
        setGeneratedPrompt(null);
        setEditedPrompt(null);
        toast({
          title: "Room redesigned successfully!",
          description: "Your AI-generated design is ready.",
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

  const handleGeneratePrompt = (formData: RoomRedesignRequest) => {
    if (!originalImage) {
      toast({
        variant: "destructive",
        title: "No image",
        description: "Please upload or provide an image URL first",
      });
      return;
    }

    promptMutation.mutate({
      ...formData,
      imageData: originalImage,
    });
  };

  const handleGenerate = (formData: RoomRedesignRequest) => {
    if (!originalImage || !editedPrompt) {
      toast({
        variant: "destructive",
        title: "Missing data",
        description: "Please upload an image and generate a prompt first",
      });
      return;
    }

    generateMutation.mutate({
      ...formData,
      imageData: originalImage,
      prompt: editedPrompt,
    });
  };

  const handleCancelPrompt = () => {
    setGeneratedPrompt(null);
    setEditedPrompt(null);
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
            <ImageUploadTabs onImageLoad={setOriginalImage} />
            <ControlPanel 
              onGenerate={handleGenerate}
              onGeneratePrompt={handleGeneratePrompt}
              disabled={!originalImage}
              isGenerating={generateMutation.isPending}
              isGeneratingPrompt={promptMutation.isPending}
              generatedPrompt={generatedPrompt}
              onPromptChange={setEditedPrompt}
              onCancelPrompt={handleCancelPrompt}
            />
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 overflow-auto">
        <ImageCanvas 
          originalImage={originalImage}
          generatedImage={generatedImage}
        />
      </main>

      {/* Loading Overlay */}
      {(generateMutation.isPending || promptMutation.isPending) && <LoadingOverlay />}
    </div>
  );
}
