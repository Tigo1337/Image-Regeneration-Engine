import type { Express } from "express";
import { storage } from "../storage";
import { getUserId } from "../middleware/auth";
import { uploadImageToStorage } from "../image-storage";

export function registerGalleryRoutes(app: Express) {
  // Get prompts history
  app.get("/api/prompts-history", async (req, res) => {
    try {
      if (storage.getPromptLogs) {
        const logs = await storage.getPromptLogs();
        res.json(logs);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompt logs" });
    }
  });

  // Save design to gallery
  app.post("/api/gallery/save", async (req, res) => {
    try {
      const { originalImage, generatedImage, originalFileName, config, variations = [] } = req.body;

      const uploadPromises = [
        uploadImageToStorage(originalImage, "originals"),
        uploadImageToStorage(generatedImage, "generated"),
      ];

      const variationUrls = await Promise.all(variations.map((v: string) => uploadImageToStorage(v, "generated")));
      const [originalImageUrl, generatedImageUrl] = await Promise.all(uploadPromises);

      const design = await storage.saveGeneratedDesign({
        userId: getUserId(req),
        timestamp: Date.now(),
        originalImageUrl,
        generatedImageUrl,
        originalFileName,
        config,
        variations: variationUrls,
      });
      res.json({ success: true, design });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to save" });
    }
  });

  // Get gallery designs for user
  app.get("/api/gallery", async (req, res) => {
    try {
      const userId = getUserId(req);
      const designs = await storage.getGeneratedDesigns(userId);
      res.json(designs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch" });
    }
  });
}
