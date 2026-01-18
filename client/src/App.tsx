import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/header";
import { LandingHeader } from "@/components/landing-header";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Gallery from "@/pages/gallery";
import Pricing from "@/pages/pricing";
import PrivacyPolicy from "@/pages/privacy"; // [NEW] Import
import NotFound from "@/pages/not-found";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/app" component={Home} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/privacy" component={PrivacyPolicy} /> {/* [NEW] Route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  // Update logic: Neither Landing nor Privacy page should show the App Header
  const isMarketingPage = location === "/" || location === "/privacy"; 

  if (isMarketingPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LandingHeader />
          {/* Render Landing strictly on root, otherwise let Router handle /privacy */}
          {location === "/" ? <Landing /> : <AppRoutes />} 
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <AppRoutes />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;