import { z } from "zod";
import { pgTable, text, serial, bigint, jsonb, timestamp } from "drizzle-orm/pg-core";

// Available styles for room redesign
export const availableStyles = [
  "Modern",
  "Contemporary",
  "Boho",
  "Industrial",
  "Scandinavian",
  "Mid-Century Modern",
  "Farmhouse",
  "Coastal",
  "Transitional",
  "Japandi",
  "Maximalist",
] as const;

// [NEW] Updated Product Types for Dimensional Tool
export const productTypes = [
  "Bathtub",
  "Shower",
  "Vanity",
  "Shower Door",
  "Shower Base",
  "Tub Shower"
] as const;

// Prompt types
export const promptTypes = ["room-scene", "dimensional"] as const;

// Output formats
export const outputFormats = ["PNG", "JPEG", "WebP"] as const;

// View Angles
export const viewAngles = [
  "Original",
  "Front",
  "Side", 
  "Top"
] as const;

// Room redesign request schema
export const roomRedesignRequestSchema = z.object({
  promptType: z.enum(promptTypes).default("room-scene"),

  // Dimensional Fields
  productType: z.enum(productTypes).optional(),
  productHeight: z.string().optional(),
  productWidth: z.string().optional(),
  productDepth: z.string().optional(),
  showTopLegend: z.boolean().default(true),
  showBottomDisclaimer: z.boolean().default(true),

  preservedElements: z.string(),
  addedElements: z.string().optional(),
  closeupFocus: z.string().optional(),
  referenceImages: z.array(z.string()).optional(),
  referenceDrawing: z.string().optional(),
  structureAnalysis: z.string().nullish(), 
  viewAngle: z.enum(viewAngles).default("Original"),
  cameraZoom: z.number().min(50).max(200).default(100),
  useSmartZoom: z.boolean().default(false),
  smartZoomObject: z.string().optional(),
  smartFillRatio: z.number().min(20).max(100).optional(),
  targetStyle: z.enum(availableStyles),
  quality: z.enum(["Standard", "High Fidelity (2K)", "Ultra (4K)"]),
  aspectRatio: z.enum(["Original", "16:9", "1:1", "4:3"]),
  creativityLevel: z.number().min(0).max(100),
  outputFormat: z.enum(outputFormats).default("PNG"),
});

export const smartCropRequestSchema = z.object({
  objectName: z.string().min(1, "Object name is required"),
  fillRatio: z.number().min(10).max(100).default(80), 
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:5", "Original"]),
});

export type RoomRedesignRequest = z.infer<typeof roomRedesignRequestSchema>;
export type SmartCropRequest = z.infer<typeof smartCropRequestSchema>;

export interface RoomRedesignResponse {
  success: boolean;
  generatedImage?: string; 
  error?: string;
  variations?: string[];
  structureAnalysis?: string;
}

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
});

export const generatedDesigns = pgTable("generated_designs", {
  id: text("id").primaryKey(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  originalImageUrl: text("original_image_url").notNull(),
  generatedImageUrl: text("generated_image_url").notNull(),
  originalFileName: text("original_file_name").notNull(),
  config: jsonb("config").notNull(),
  variations: jsonb("variations").$type<string[]>().default([]),
});

export const promptLogs = pgTable("prompt_logs", {
  id: serial("id").primaryKey(),
  jobType: text("job_type").notNull(), 
  prompt: text("prompt").notNull(),
  parameters: jsonb("parameters"), 
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type GeneratedDesign = typeof generatedDesigns.$inferSelect;
export type InsertGeneratedDesign = typeof generatedDesigns.$inferInsert;
export type PromptLog = typeof promptLogs.$inferSelect;
export type InsertPromptLog = typeof promptLogs.$inferInsert;