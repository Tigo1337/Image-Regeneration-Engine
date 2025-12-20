import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomRedesignRequestSchema, availableStyles, outputFormats, viewAngles, type RoomRedesignRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Sparkles, AlertCircle, FileText, Edit3, PlusCircle, Layers, ZoomIn, Camera, MoveHorizontal } from "lucide-react";
import { constructPrompt, promptTypes, type PromptType } from "@/lib/prompt-builder";

interface ControlPanelProps {
  onGenerate: (data: RoomRedesignRequest, prompt: string, batchSize?: number) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  isModificationMode?: boolean;
  modificationPrompt?: string;
  onModificationPromptChange?: (prompt: string) => void;
}

export function ControlPanel({ 
  onGenerate, 
  disabled, 
  isGenerating,
  isModificationMode = false,
  modificationPrompt = "",
  onModificationPromptChange,
}: ControlPanelProps) {
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);

  const form = useForm<RoomRedesignRequest>({
    resolver: zodResolver(roomRedesignRequestSchema),
    defaultValues: {
      promptType: "room-scene",
      preservedElements: "",
      addedElements: "", 
      closeupFocus: "", 
      viewAngle: "Original", // [UPDATED] Default to Original
      cameraZoom: 100, 
      targetStyle: "Modern",
      quality: "Standard",
      aspectRatio: "Original",
      creativityLevel: 50,
      outputFormat: "PNG",
    },
  });

  const watchedValues = useWatch({
    control: form.control,
  });

  const generatedPrompt = constructPrompt({
    promptType: (watchedValues.promptType as PromptType) || "room-scene",
    style: watchedValues.targetStyle || "Modern",
    preservedElements: watchedValues.preservedElements || "",
    addedElements: watchedValues.addedElements || "", 
    viewAngle: watchedValues.viewAngle || "Original",
    cameraZoom: watchedValues.cameraZoom || 100,
    creativityLevel: watchedValues.creativityLevel || 50,
    centerPreservedElements: true,
  });

  useEffect(() => {
    if (!isManualOverride) {
      setEditedPrompt(generatedPrompt);
    }
  }, [generatedPrompt, isManualOverride]);

  const handleManualOverrideToggle = (enabled: boolean) => {
    setIsManualOverride(enabled);
    if (!enabled) {
      setEditedPrompt(generatedPrompt);
    }
  };

  const handleGenerate = () => {
    const formData = form.getValues();
    const promptToUse = isManualOverride ? editedPrompt : generatedPrompt;
    onGenerate(formData, promptToUse, isBatchMode ? 4 : 1);
  };

  const currentPrompt = isManualOverride ? editedPrompt : generatedPrompt;
  const hasPrompt = currentPrompt.trim().length > 0;

  if (isModificationMode) {
     // ... (Modification mode UI remains unchanged)
    return (
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
            <div>
              <Label className="text-sm font-semibold text-card-foreground">
                Request Modifications
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Describe the changes you'd like to make to the generated image
              </p>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-md">
            <Label className="text-sm font-semibold text-card-foreground mb-2 block">
              Modification Request
            </Label>
            <textarea
              value={modificationPrompt}
              onChange={(e) => onModificationPromptChange?.(e.target.value)}
              placeholder="e.g., Change the shower door and fixtures to a matte black finish..."
              className="w-full h-24 p-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {modificationPrompt && (
            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={disabled || isGenerating}
              onClick={() => onGenerate(form.getValues(), modificationPrompt, 1)}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isGenerating ? "Generating..." : "Apply Modification"}
            </Button>
          )}
        </div>
      );
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-6">
        <Separator />

        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
            <div>
              <Label className="text-sm font-semibold text-card-foreground">
                Configuration
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Specify what to preserve and how to transform
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="preservedElements"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Elements to Preserve</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., The bathtub, The ceiling fan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="addedElements"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1">
                  Elements to Add <PlusCircle className="w-3 h-3 text-primary" />
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., A large persian rug" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* VIEW ANGLE SELECTOR */}
          <div className="grid grid-cols-1 gap-4">
             <FormField
              control={form.control}
              name="viewAngle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1">
                    View Angle <MoveHorizontal className="w-3 h-3 text-primary" />
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select angle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {viewAngles.map((angle) => (
                        <SelectItem key={angle} value={angle}>
                          {angle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CAMERA DISTANCE SLIDER */}
            <FormField
              control={form.control}
              name="cameraZoom"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-sm font-medium flex items-center gap-1">
                      Distance / Zoom <ZoomIn className="w-3 h-3 text-primary" />
                    </FormLabel>
                    <span className="text-xs text-muted-foreground">
                      {field.value < 100 ? "Far (Wide)" : field.value > 100 ? "Close-up" : "Original"} ({field.value}%)
                    </span>
                  </div>
                  <FormControl>
                    <div className="pt-2">
                      <Slider
                        min={50}
                        max={200}
                        step={10}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Lower for wide shots, Higher for detail shots.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="targetStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Target Style</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableStyles.map((style) => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

           <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Quality</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="High Fidelity (2K)">High Fidelity (2K)</SelectItem>
                      <SelectItem value="Ultra (4K)">Ultra (4K)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="aspectRatio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Aspect Ratio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select aspect ratio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Original">Original</SelectItem>
                      <SelectItem value="16:9">16:9</SelectItem>
                      <SelectItem value="1:1">1:1</SelectItem>
                      <SelectItem value="4:3">4:3</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

           <FormField
            control={form.control}
            name="creativityLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Creativity Level: {field.value}%
                </FormLabel>
                <FormControl>
                  <div className="pt-2">
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Low: Keeps layout/walls. High: Redesigns structure.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Batch Mode UI */}
        <div className="flex flex-col gap-4 bg-primary/5 p-3 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <Layers className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
              <div>
                <Label htmlFor="batch-mode" className="text-sm font-semibold text-foreground cursor-pointer">
                  Generate Variations
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create 4 images (Front, Close-up, Angled, Far)
                </p>
              </div>
            </div>
            <Switch
              id="batch-mode"
              checked={isBatchMode}
              onCheckedChange={setIsBatchMode}
            />
          </div>
          {isBatchMode && (
            <FormField
              control={form.control}
              name="closeupFocus"
              render={({ field }) => (
                <FormItem className="animate-in fade-in slide-in-from-top-2">
                  <FormLabel className="text-xs font-medium flex items-center gap-1 text-primary">
                    <ZoomIn className="w-3 h-3" />
                    Close-up Focus (Image 2)
                  </FormLabel>
                  <FormControl>
                    <Input className="h-8 text-xs bg-background/80" placeholder="e.g., Shower Door Handle" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <Edit3 className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
              <div>
                <Label className="text-sm font-semibold text-card-foreground">Generated Prompt</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="manual-override" className="text-xs text-muted-foreground">Edit</Label>
              <Switch id="manual-override" checked={isManualOverride} onCheckedChange={handleManualOverrideToggle} />
            </div>
          </div>
          <textarea
            value={currentPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            readOnly={!isManualOverride}
            className={`w-full h-24 p-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none ${!isManualOverride ? 'cursor-default opacity-80' : ''}`}
          />
          <Button type="submit" className="w-full" size="lg" disabled={disabled || isGenerating || !hasPrompt}>
            <Sparkles className="w-5 h-5 mr-2" />
            {isGenerating ? "Generating..." : (isBatchMode ? "Generate 4 Variations" : "Generate Redesign")}
          </Button>
        </div>
      </form>
    </Form>
  );
}