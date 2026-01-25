import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { registerAccountRoutes } from "./routes/account";
import { registerBillingRoutes } from "./routes/billing";
import { registerGalleryRoutes } from "./routes/gallery";
import { registerDesignRoutes } from "./routes/design";
import { registerDimensionRoutes } from "./routes/dimensions";
import { registerCropRoutes } from "./routes/crop";
import { registerModifyGeneratedRoutes } from "./routes/modify-generated";
import { registerModifyRoutes } from "./routes/modify";
import { registerOutpaintRoutes } from "./routes/outpaint";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication (MUST be first)
  await setupAuth(app);
  registerAuthRoutes(app);

  // Register route modules in order
  registerAccountRoutes(app);          // Law 25 compliance endpoints
  registerBillingRoutes(app);          // Stripe payment routes
  registerDesignRoutes(app);           // Core design generation (/api/generate, /api/generate/batch-styles, /api/variations)
  registerDimensionRoutes(app);        // Dimensional image generation (/api/generate-dimensional)
  registerCropRoutes(app);             // Smart crop functionality (/api/smart-crop)
  registerModifyGeneratedRoutes(app);  // Modify generated images (/api/modify-generated)
  registerModifyRoutes(app);           // Legacy modify route (/api/modify) - foundation for Specific Element Update
  registerOutpaintRoutes(app);         // Outpaint/uncrop image extension (/api/outpaint)
  registerGalleryRoutes(app);          // Gallery and prompt history
  registerObjectStorageRoutes(app);    // Object storage integration

  const httpServer = createServer(app);
  return httpServer;
}
