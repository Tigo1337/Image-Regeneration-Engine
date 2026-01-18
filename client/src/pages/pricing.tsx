import { LandingHeader } from "@/components/landing-header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, CreditCard, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
  metadata: { quality?: string; type?: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata: { type?: string } | null;
  prices: Price[];
}

export default function Pricing() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/stripe/products"],
  });

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery<{ subscription: any; hasActiveSubscription: boolean }>({
    queryKey: ["/api/stripe/subscription"],
    enabled: isAuthenticated,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start checkout. Please try again.",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open billing portal.",
      });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "Welcome to RoomReimagine Pro!",
        description: "Your subscription is now active. Start creating amazing designs!",
      });
      setLocation("/pricing");
    } else if (params.get("canceled") === "true") {
      toast({
        variant: "destructive",
        title: "Checkout canceled",
        description: "Your subscription was not completed.",
      });
      setLocation("/pricing");
    }
  }, []);

  const handleSubscribe = (priceId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    checkoutMutation.mutate(priceId);
  };

  const isLoading = authLoading || productsLoading || subscriptionLoading;

  const subscriptionProduct = productsData?.products?.find(p => p.metadata?.type === "subscription");
  const usageProduct = productsData?.products?.find(p => p.metadata?.type === "usage");

  const monthlyPrice = subscriptionProduct?.prices?.find(p => p.recurring?.interval === "month");

  const hasActiveSubscription = subscriptionData?.hasActiveSubscription;

  return (
    <div className="min-h-screen bg-background pt-[124px]">
      <LandingHeader />
      <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Pricing</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Transform your rooms with AI-powered interior design. Subscribe to get started, then pay only for what you generate.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
              Required
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                RoomReimagine Pro
              </CardTitle>
              <CardDescription>
                Monthly subscription for platform access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${monthlyPrice ? (monthlyPrice.unit_amount / 100).toFixed(2) : "79.00"}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Unlimited access to all design styles
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Smart Crop & Dimensional Images
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Batch generation across all styles
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Gallery with history persistence
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Reference images & mood boards
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              {hasActiveSubscription ? (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  data-testid="button-manage-billing"
                >
                  {portalMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => monthlyPrice && handleSubscribe(monthlyPrice.id)}
                  disabled={checkoutMutation.isPending || !monthlyPrice}
                  data-testid="button-subscribe"
                >
                  {checkoutMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {isAuthenticated ? "Subscribe Now" : "Sign In to Subscribe"}
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage-Based Pricing</CardTitle>
              <CardDescription>
                Pay per generated image based on quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Standard Quality</p>
                    <p className="text-sm text-muted-foreground">Fast generation</p>
                  </div>
                  <Badge variant="secondary">$0.20/image</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">High Fidelity (2K)</p>
                    <p className="text-sm text-muted-foreground">Enhanced detail</p>
                  </div>
                  <Badge variant="secondary">$0.35/image</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Ultra (4K)</p>
                    <p className="text-sm text-muted-foreground">Maximum quality</p>
                  </div>
                  <Badge variant="secondary">$0.50/image</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Usage is billed at the end of each billing cycle based on the number of images generated.
              </p>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Included with Pro subscription. Pay only for what you use.
            </CardFooter>
          </Card>
        </div>
      )}

      {hasActiveSubscription && (
        <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
          <p className="text-primary font-medium">
            You have an active subscription. Start designing now!
          </p>
          <Button 
            variant="ghost" 
            className="mt-2"
            onClick={() => setLocation("/")}
            data-testid="link-start-designing"
          >
            Go to Design Studio
          </Button>
        </div>
      )}
    </div>
  </div>
);
}
