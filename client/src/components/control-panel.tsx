import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomRedesignRequestSchema, availableStyles, outputFormats, type RoomRedesignRequest } from "@shared/schema";
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
import { Sparkles, AlertCircle, FileText, Edit3, PlusCircle } from "lucide-react";
import { constructPrompt, promptTypes, type PromptType } from "@/lib/prompt-builder";

interface ControlPanelProps {
  onGenerate: (data: RoomRedesignRequest, prompt: string) => void;
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

  const form = useForm<RoomRedesignRequest>({
    resolver: zodResolver(roomRedesignRequestSchema),
    defaultValues: {
      promptType: "room-scene",
      preservedElements: "",
      addedElements: "", // Default value
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
    addedElements: watchedValues.addedElements || "", // Pass to builder
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
    onGenerate(formData, promptToUse);
  };

  const currentPrompt = isManualOverride ? editedPrompt : generatedPrompt;
  const hasPrompt = currentPrompt.trim().length > 0;

  if (isModificationMode) {
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
            data-testid="textarea-modification-request"
          />
        </div>

        {modificationPrompt && (
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={disabled || isGenerating}
            onClick={() => onGenerate(form.getValues(), modificationPrompt)}
            data-testid="button-apply-modification"
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
            <FileText className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
            <div>
              <Label className="text-sm font-semibold text-card-foreground">
                Prompt Type
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Select the type of transformation
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="promptType"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-prompt-type">
                      <SelectValue placeholder="Select prompt type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {promptTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                <FormLabel className="text-sm font-medium">
                  Elements to Preserve
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., The bathtub, The ceiling fan"
                    {...field}
                    data-testid="input-preserved-elements"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  List specific objects that must remain unchanged
                </FormDescription>
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
                  <Input
                    placeholder="e.g., A large persian rug, A standing lamp"
                    {...field}
                    value={field.value || ""}
                    data-testid="input-added-elements"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Objects to insert into the generated scene
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Target Style</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-target-style">
                      <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableStyles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Quality / Resolution</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-quality">
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
                    <SelectTrigger data-testid="select-aspect-ratio">
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
                      data-testid="slider-creativity"
                    />
                  </div>
                </FormControl>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Subtle Change</span>
                  <span>Total Transformation</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="outputFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Output Format</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-output-format">
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {outputFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Choose the format for the generated image
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <Edit3 className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
              <div>
                <Label className="text-sm font-semibold text-card-foreground">
                  Generated Prompt
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Preview and optionally edit the prompt
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="manual-override" className="text-xs text-muted-foreground">
                Edit
              </Label>
              <Switch
                id="manual-override"
                checked={isManualOverride}
                onCheckedChange={handleManualOverrideToggle}
                data-testid="switch-manual-override"
              />
            </div>
          </div>

          <div className={`bg-muted p-4 rounded-md border-2 ${isManualOverride ? 'border-primary' : 'border-transparent'}`}>
            <textarea
              value={currentPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              readOnly={!isManualOverride}
              className={`w-full h-40 p-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                !isManualOverride ? 'cursor-default opacity-80' : ''
              }`}
              data-testid="textarea-generated-prompt"
            />
            {isManualOverride && (
              <p className="text-xs text-primary mt-2">
                Manual override enabled - your edits will be used
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={disabled || isGenerating || !hasPrompt}
            data-testid="button-generate-redesign"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isGenerating ? "Generating..." : "Generate Redesign"}
          </Button>
        </div>
      </form>
    </Form>
  );
}