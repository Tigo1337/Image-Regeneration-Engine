import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function LandingHeader() {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-background/80 backdrop-blur-lg border-b shadow-sm" 
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg" data-testid="text-landing-logo">RoomReimagine AI</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">
              Features
            </a>
            <a href="#gallery" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-gallery-section">
              Gallery
            </a>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing-landing">
              Pricing
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild data-testid="button-open-app">
                <Link href="/app">Open App</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild data-testid="button-landing-login">
                  <a href="/api/login">Sign In</a>
                </Button>
                <Button size="sm" asChild data-testid="button-landing-signup">
                  <Link href="/app">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
