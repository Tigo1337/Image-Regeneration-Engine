import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { registerAccountRoutes } from "./routes/account";
import { registerBillingRoutes } from "./routes/billing";
import { registerGenerationRoutes } from "./routes/generation";
import { registerGalleryRoutes } from "./routes/gallery";
import { registerImageToolRoutes } from "./routes/image-tools";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication (MUST be first)
  await setupAuth(app);
  registerAuthRoutes(app);

  // Register route modules in order
  registerAccountRoutes(app);     // Law 25 compliance endpoints
  registerBillingRoutes(app);     // Stripe payment routes
  registerGenerationRoutes(app);  // Core AI generation endpoints
  registerGalleryRoutes(app);     // Gallery and prompt history
  registerImageToolRoutes(app);   // Smart crop and image tools
  registerObjectStorageRoutes(app); // Object storage integration

  const httpServer = createServer(app);
  return httpServer;
}
