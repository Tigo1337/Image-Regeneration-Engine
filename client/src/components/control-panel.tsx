import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomRedesignRequestSchema, type RoomRedesignRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { Sparkles, AlertCircle } from "lucide-react";

interface ControlPanelProps {
  onGenerate: (data: RoomRedesignRequest) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  manualPrompt?: string;
  onManualPromptChange?: (prompt: string) => void;
  isModificationMode?: boolean;
}

export function ControlPanel({ 
  onGenerate, 
  disabled, 
  isGenerating,
  manualPrompt = "",
  onManualPromptChange,
  isModificationMode = false
}: ControlPanelProps) {
  const form = useForm<RoomRedesignRequest>({
    resolver: zodResolver(roomRedesignRequestSchema),
    defaultValues: {
      preservedElements: isModificationMode ? "" : "",
      targetStyle: "Modern",
      quality: "Standard",
      aspectRatio: "Original",
      creativityLevel: 50,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-6">
        <Separator />

        {!isModificationMode && (
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
                    Elements to Preserve <span className="text-primary">*CRUCIAL*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Shower Base, Ceiling Fan, Window"
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
                      <SelectItem value="Modern">Modern</SelectItem>
                      <SelectItem value="Contemporary">Contemporary</SelectItem>
                      <SelectItem value="Boho">Boho</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Scandinavian">Scandinavian</SelectItem>
                      <SelectItem value="Mid-Century Modern">Mid-Century Modern</SelectItem>
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
          </div>
        )}

        <div className="space-y-3">
          {isModificationMode && (
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
          )}

          <div className="bg-muted p-4 rounded-md">
            <Label className="text-sm font-semibold text-card-foreground mb-2 block">
              {isModificationMode ? "Modification Request" : "Design Prompt"}
            </Label>
            <textarea
              value={manualPrompt}
              onChange={(e) => onManualPromptChange?.(e.target.value)}
              placeholder={isModificationMode 
                ? "e.g., Change the shower door and fixtures to a matte black finish..."
                : "Describe your desired interior design..."}
              className="w-full h-24 p-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid={isModificationMode ? "textarea-modification-request" : "textarea-manual-prompt"}
            />
          </div>

          {manualPrompt && (
            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={disabled || isGenerating}
              onClick={() => onGenerate(form.getValues())}
              data-testid={isModificationMode ? "button-apply-modification" : "button-generate-with-manual"}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isGenerating ? "Generating..." : isModificationMode ? "Apply Modification" : "Generate Redesign"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
