import { Loader } from "lucide-react";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <Loader className="w-12 h-12 text-primary animate-spin" data-testid="loader-spinner" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">
            Generating Your Design
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Our AI is analyzing your room and creating a stunning redesign. This may take a moment...
          </p>
        </div>
      </div>
    </div>
  );
}
