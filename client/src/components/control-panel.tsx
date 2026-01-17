import { useState, useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomRedesignRequestSchema, availableStyles, outputFormats, productTypes, heightPlacements, widthPlacements, depthPlacements, type RoomRedesignRequest, type SmartCropRequest, type DimensionalImageRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea"; 
import { Checkbox } from "@/components/ui/checkbox"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { 
  Sparkles, AlertCircle, FileText, Layers, 
  ZoomIn, Upload, X, Crop, Ruler 
} from "lucide-react";
import { constructPrompt, type PromptType, styleDescriptions } from "@/lib/prompt-builder";
import { constructDimensionalPrompt } from "@/lib/dimensional-prompt";

interface ControlPanelProps {
  onGenerate: (data: RoomRedesignRequest, prompt: string, batchSize?: number) => void;
  onGenerateVariations?: (selected: string[]) => void;
  onGenerateBatchStyles?: (data: RoomRedesignRequest, prompt: string) => void;
  onSmartCrop: (data: SmartCropRequest) => void;
  onGenerateDimensional: (data: DimensionalImageRequest) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  isModificationMode?: boolean;
  modificationPrompt?: string;
  onModificationPromptChange?: (prompt: string) => void;
  referenceImages?: string[];
  onReferenceImagesChange?: (images: string[]) => void;
  referenceDrawing?: string | null;
  onReferenceDrawingChange?: (drawing: string | null) => void;
}

export function ControlPanel({ 
  onGenerate,
  onGenerateVariations,
  onGenerateBatchStyles,
  onSmartCrop,
  onGenerateDimensional,
  disabled, 
  isGenerating,
  isModificationMode = false,
  modificationPrompt = "",
  onModificationPromptChange,
  referenceImages = [],
  onReferenceImagesChange,
  referenceDrawing = null,
  onReferenceDrawingChange,
}: ControlPanelProps) {

  const [styleContext, setStyleContext] = useState("");
  const [selectedVariations, setSelectedVariations] = useState<string[]>(["Front", "Side", "Top"]);
  const [activeTab, setActiveTab] = useState("design");
  const [generateAllStyles, setGenerateAllStyles] = useState(false); 

  const [generateMultiple, setGenerateMultiple] = useState(false);
  const [batchSize, setBatchSize] = useState(1);

  // Local state for Smart Crop Tab
  const [cropObject, setCropObject] = useState("");
  const [cropFill, setCropFill] = useState(80);
  const [cropRatio, setCropRatio] = useState<"1:1" | "9:16" | "16:9" | "4:5">("1:1");

  // Local state for Dimensional Tab
  const [dimProductType, setDimProductType] = useState<typeof productTypes[number]>("Shower Base");
  const [dimHeight, setDimHeight] = useState("");
  const [dimWidth, setDimWidth] = useState("");
  const [dimDepth, setDimDepth] = useState("");
  const [dimHeightPlacement, setDimHeightPlacement] = useState<typeof heightPlacements[number]>("Left Side (Vertical)");
  const [dimWidthPlacement, setDimWidthPlacement] = useState<typeof widthPlacements[number]>("Front Bottom");
  const [dimDepthPlacement, setDimDepthPlacement] = useState<typeof depthPlacements[number]>("Left Side (Perspective)");
  const [dimFillRatio, setDimFillRatio] = useState(60);
  const [dimShowLegend, setDimShowLegend] = useState(true);
  const [dimShowDisclaimer, setDimShowDisclaimer] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<RoomRedesignRequest>({
    resolver: zodResolver(roomRedesignRequestSchema),
    defaultValues: {
      promptType: "room-scene",
      preservedElements: "",
      viewAngle: "Original",
      cameraZoom: 100, 
      targetStyle: "Modern",
      quality: "Standard",
      aspectRatio: "Original",
      creativityLevel: 2, 
      outputFormat: "PNG",
      referenceImages: [],
      referenceDrawing: undefined,
    },
  });

  const watchedValues = useWatch({
    control: form.control,
  });

  useEffect(() => {
    const currentStyle = watchedValues.targetStyle;
    if (currentStyle && styleDescriptions[currentStyle]) {
      setStyleContext(styleDescriptions[currentStyle]);
    }
  }, [watchedValues.targetStyle]);

  // Helper function to provide descriptions for the 4 complexity tiers
  const getComplexityTier = (value: number) => {
    switch (value) {
      case 1:
        return {
          label: "Refresh",
          desc: "Surface updates only. Materials and colors change, but architecture is 100% fixed."
        };
      case 2:
        return {
          label: "Renovate",
          desc: "Decorative architecture. Adds moldings and built-ins while keeping base structure fixed."
        };
      case 3:
        return {
          label: "Remodel",
          desc: "Structural remodeling. Redesigns wall/ceiling shapes but keeps windows and doors in place."
        };
      case 4:
        return {
          label: "Metamorphosis",
          desc: "Total architectural freedom. Deconstructs the entire room; can move windows and skylights."
        };
      default:
        return { label: "Standard", desc: "" };
    }
  };

  const toggleVariation = (type: string) => {
    setSelectedVariations(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && onReferenceImagesChange) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string);
            if (newImages.length === files.length) {
              const updatedList = [...referenceImages, ...newImages];
              onReferenceImagesChange(updatedList);
              form.setValue("referenceImages", updatedList);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDrawingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReferenceDrawingChange) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const result = event.target.result as string;
          onReferenceDrawingChange(result);
          form.setValue("referenceDrawing", result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = (indexToRemove: number) => {
    if (onReferenceImagesChange) {
      const updatedList = referenceImages.filter((_, index) => index !== indexToRemove);
      onReferenceImagesChange(updatedList);
      form.setValue("referenceImages", updatedList);
    }
  };

  const removeReferenceDrawing = () => {
    if (onReferenceDrawingChange) {
      onReferenceDrawingChange(null);
      form.setValue("referenceDrawing", undefined);
    }
  };

  const generatedPrompt = constructPrompt({
    promptType: (watchedValues.promptType as PromptType) || "room-scene",
    style: watchedValues.targetStyle || "Modern",
    preservedElements: watchedValues.preservedElements || "",
    viewAngle: "Original",
    cameraZoom: watchedValues.cameraZoom || 100,
    creativityLevel: watchedValues.creativityLevel || 2,
    customStyleDescription: styleContext,
  });

  const handleGenerate = () => {
    const formData = form.getValues();
    formData.referenceImages = referenceImages;
    formData.referenceDrawing = referenceDrawing || undefined;

    if (generateAllStyles && onGenerateBatchStyles) {
      onGenerateBatchStyles(formData, generatedPrompt);
    } else {
      onGenerate(formData, generatedPrompt, generateMultiple ? batchSize : 1);
    }
  };

  if (isModificationMode) {
    return (
        <div className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-3">
             <div className="flex items-start gap-2">
                <Layers className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Additional Perspectives
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Select views to generate:
                  </p>
                </div>
             </div>

             <div className="flex gap-4 my-2">
               {["Front", "Side", "Top"].map((type) => (
                 <div key={type} className="flex items-center space-x-2">
                   <Checkbox 
                      id={`chk-${type}`} 
                      checked={selectedVariations.includes(type)}
                      onCheckedChange={() => toggleVariation(type)}
                   />
                   <label
                      htmlFor={`chk-${type}`}
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type}
                    </label>
                 </div>
               ))}
             </div>

             <Button 
                type="button" 
                variant="outline" 
                className="w-full border-primary/30 hover:bg-primary/10"
                onClick={() => onGenerateVariations?.(selectedVariations)}
                disabled={disabled || isGenerating || selectedVariations.length === 0}
              >
                {isGenerating ? "Processing..." : `Generate ${selectedVariations.length} View${selectedVariations.length !== 1 ? 's' : ''}`}
             </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
              <div>
                <Label className="text-sm font-semibold text-card-foreground">
                  Request Modifications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Describe specific changes to the current image
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
        </div>
      );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="design" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="crop">Crop</TabsTrigger>
          <TabsTrigger value="dimensional">Dimensions</TabsTrigger>
        </TabsList>

        {/* --- DESIGN TAB --- */}
        <TabsContent value="design" className="mt-4">
          <Form {...form}>
            <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-6">

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
                        <Input placeholder="e.g., The bathtub" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reference Images */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    Reference Images (Optional) <Upload className="w-3 h-3 text-primary" />
                  </Label>
                  <div 
                    className="border border-dashed border-input rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer text-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleReferenceUpload} 
                    />
                    <p className="text-xs text-muted-foreground">
                      {referenceImages.length > 0 
                        ? `${referenceImages.length} images selected` 
                        : "Click to upload Side/Back views for better 3D accuracy"}
                    </p>
                  </div>
                  {referenceImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {referenceImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-border group">
                          <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeReferenceImage(idx);
                            }}
                            className="absolute top-0 right-0 bg-black/50 hover:bg-destructive text-white p-0.5 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drawing */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    Reference Drawing (PDF/Img) <FileText className="w-3 h-3 text-primary" />
                  </Label>
                  <div 
                    className="border border-dashed border-input rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer text-center"
                    onClick={() => drawingInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      accept=".pdf,image/*" 
                      className="hidden" 
                      ref={drawingInputRef} 
                      onChange={handleDrawingUpload} 
                    />
                    <p className="text-xs text-muted-foreground">
                      {referenceDrawing 
                        ? "Drawing uploaded (Click to change)" 
                        : "Upload Technical Drawing / Blueprint / PDF"}
                    </p>
                  </div>
                  {referenceDrawing && (
                    <div className="relative mt-2 p-2 border border-border rounded-md bg-muted/20 flex items-center gap-3 group">
                      <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded text-primary">
                        {referenceDrawing.startsWith('data:application/pdf') ? <FileText className="w-6 h-6" /> : <img src={referenceDrawing} className="w-full h-full object-cover rounded" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {referenceDrawing.startsWith('data:application/pdf') ? "Technical Drawing (PDF)" : "Technical Drawing (Image)"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Using for dimensions & scale</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeReferenceDrawing();
                        }}
                        className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-muted/30 p-3 rounded-md border border-border/50 space-y-3">
                  <FormField
                    control={form.control}
                    name="cameraZoom"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <Label className="text-xs flex items-center gap-1">
                            Manual Zoom <ZoomIn className="w-3 h-3 text-primary" />
                          </Label>
                          <span className="text-[10px] text-muted-foreground">
                            {field.value}%
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
                        <FormDescription className="text-[10px]">
                          Simple center crop (100% = Original).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="targetStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Target Style</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={generateAllStyles}
                        >
                          <FormControl>
                            <SelectTrigger className={generateAllStyles ? "opacity-50" : ""}>
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

                  <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-md border border-primary/20">
                    <Checkbox 
                      id="generate-all-styles"
                      checked={generateAllStyles}
                      onCheckedChange={(checked) => {
                        setGenerateAllStyles(checked === true);
                        if (checked === true) setGenerateMultiple(false);
                      }}
                      data-testid="checkbox-generate-all-styles"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="generate-all-styles"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Generate All Styles
                      </label>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Generate {availableStyles.length} designs in parallel (one for each style)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-md border border-primary/20">
                    <Checkbox 
                      id="generate-multiple"
                      checked={generateMultiple}
                      onCheckedChange={(checked) => {
                        setGenerateMultiple(checked === true);
                        if (checked === true) setGenerateAllStyles(false);
                      }}
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <label htmlFor="generate-multiple" className="text-sm font-medium leading-none cursor-pointer">
                        Generate Multiple Variations
                      </label>
                      {generateMultiple && (
                        <div className="flex items-center gap-2">
                           <Input 
                            type="number" 
                            min={1} max={10} 
                            value={batchSize} 
                            onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-xs bg-background"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {!generateAllStyles && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">Style Characteristics (Editable)</Label>
                      <Textarea 
                        value={styleContext}
                        onChange={(e) => setStyleContext(e.target.value)}
                        className="h-20 text-xs resize-none"
                        placeholder="Style details will appear here..."
                      />
                    </div>
                  )}
                </div>

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
                  <FormField
                    control={form.control}
                    name="outputFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Output Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {outputFormats.map((fmt) => (
                              <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* --- 4-POINT COMPLEXITY SLIDER --- */}
                <FormField
                  control={form.control}
                  name="creativityLevel"
                  render={({ field }) => {
                    const tier = getComplexityTier(field.value); //
                    return (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-medium">
                          Complexity Level: <span className="text-primary">{tier.label}</span>
                        </FormLabel>
                        <FormControl>
                          <div className="pt-1 px-1">
                            <Slider
                              min={1}
                              max={4}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-semibold">
                              <span>Refresh</span>
                              <span>Renovate</span>
                              <span>Remodel</span>
                              <span>Meta</span>
                            </div>
                          </div>
                        </FormControl>
                        {/* --- DYNAMIC DESCRIPTION --- */}
                        <div className="bg-primary/5 border border-primary/10 rounded-md p-3">
                          <p className="text-[11px] leading-relaxed text-card-foreground/80 italic">
                            {tier.desc}
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <Separator />
              <div className="space-y-3">
                <Button type="submit" className="w-full" size="lg" disabled={disabled || isGenerating}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {isGenerating 
                    ? (generateAllStyles ? `Generating ${availableStyles.length} Styles...` : generateMultiple ? `Generating ${batchSize} Designs...` : "Generating...") 
                    : (generateAllStyles ? `Generate All ${availableStyles.length} Styles` : generateMultiple ? `Generate ${batchSize} Variations` : "Generate Redesign")
                  }
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* --- SMART CROP TAB --- */}
        <TabsContent value="crop" className="space-y-6 mt-4">
           <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-4">
             <div className="flex items-start gap-2">
                <Crop className="w-5 h-5 mt-1 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Pixel-Perfect Smart Crop</h3>
                  <p className="text-xs text-muted-foreground">
                    Automatically detect objects and crop/scale them to a consistent ratio.
                  </p>
                </div>
             </div>

             <Separator />

             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-sm font-medium">Target Object</Label>
                   <Input 
                     placeholder="e.g., White freestanding bathtub" 
                     value={cropObject}
                     onChange={(e) => setCropObject(e.target.value)}
                     className="bg-background"
                   />
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between">
                     <Label className="text-sm font-medium">Product Fill Ratio</Label>
                     <span className="text-xs font-mono">{cropFill}%</span>
                   </div>
                   <Slider
                     min={20} max={100} step={5}
                     value={[cropFill]}
                     onValueChange={(v) => setCropFill(v[0])}
                   />
                </div>

                <div className="space-y-2">
                   <Label className="text-sm font-medium">Output Aspect Ratio</Label>
                   <Select value={cropRatio} onValueChange={(v: any) => setCropRatio(v)}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">Square (1:1)</SelectItem>
                        <SelectItem value="9:16">Story (9:16)</SelectItem>
                        <SelectItem value="4:5">Portrait (4:5)</SelectItem>
                        <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>

             <Separator />

             <Button 
               className="w-full" 
               size="lg"
               onClick={() => onSmartCrop({ 
                 objectName: cropObject, 
                 fillRatio: cropFill, 
                 aspectRatio: cropRatio 
               })}
               disabled={disabled || isGenerating || !cropObject}
             >
               <Crop className="w-5 h-5 mr-2" />
               {isGenerating ? "Processing..." : "Generate Smart Crop"}
             </Button>
           </div>
        </TabsContent>

        {/* --- DIMENSIONAL TAB --- */}
        <TabsContent value="dimensional" className="space-y-6 mt-4">
           {/* ... (Dimensional Tab content remains unchanged) */}
        </TabsContent>
      </Tabs>
    </div>
  );
}