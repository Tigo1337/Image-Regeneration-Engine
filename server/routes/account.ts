import type { Express } from "express";
import { storage } from "../storage";
import { getUserId, isSuperAdmin } from "../middleware/auth";
import { isAuthenticated } from "../replit_integrations/auth";

export function registerAccountRoutes(app: Express) {
  // [LAW 25 COMPLIANCE] Right to Erasure
  app.delete("/api/account/data", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      await storage.deleteAllUserData(userId);
      // Note: You might also want to trigger a cancellation in Stripe here
      res.json({ success: true, message: "Account and data permanently erased per Law 25." });
    } catch (error) {
      console.error("Erasure failed:", error);
      res.status(500).json({ error: "Failed to erase data." });
    }
  });

  // [LAW 25 COMPLIANCE] Right to Portability (Data Export)
  app.get("/api/account/export", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const designs = await storage.getGeneratedDesigns(userId);
      const userData = await storage.getUser(userId);

      const exportPackage = {
        user: userData,
        generatedHistory: designs,
        exportDate: new Date().toISOString(),
        complianceStatement: "Data exported in compliance with Quebec Law 25."
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=my-doculoom-data.json');
      res.send(JSON.stringify(exportPackage, null, 2));
    } catch (error) {
      res.status(500).json({ error: "Failed to export data." });
    }
  });

  // Admin info endpoint - shows your user ID and admin status
  app.get("/api/admin/info", isAuthenticated, (req: any, res) => {
    const userId = getUserId(req);
    const isAdmin = isSuperAdmin(userId);
    res.json({ userId, isSuperAdmin: isAdmin });
  });
}
