import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Gallery from "@/pages/gallery";
import NotFound from "@/pages/not-found";
// Import the new page
import PromptsHistory from "@/pages/prompts-history";
import Dimensional from "@/pages/dimensional";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/gallery" component={Gallery} />
      {/* New Route */}
      <Route path="/prompts-history" component={PromptsHistory} />
      <Route path="/dimensional" component={Dimensional} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;