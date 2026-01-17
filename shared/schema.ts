import { z } from "zod";
import { pgTable, text, serial, bigint, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

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
  "Art Deco",
  "Biophilic",
  "Desert Modern",
  "Moody Luxe",
  "Mediterranean",
  "Zen Spa",
  "Mountain Modern",
  "Soft Modern",
  "Modern Farmhouse",
  "Industrial Chic",
  "Dark Scandi",
  "Wabi-Sabi Japandi",
  "Victorian",
  "Hollywood Regency",
  "French Country",
  "Brutalist",
  "Tropical",
  "Southwestern",
  "Ultra-Minimalist",
  "Grandmillennial",
  "Eclectic",
  "Rustic",
  "Neo-Classical",
  "Memphis Design",
  "Bauhaus",
  "Retro Futurism",
  "Organic Modern",
  "Gothic Noir",
  "Shabby Chic",
] as const;

// Prompt types
export const promptTypes = ["room-scene"] as const;

// Output formats
export const outputFormats = ["PNG", "JPEG", "WebP"] as const;

// View Angles (Limited to Original per current UX)
export const viewAngles = [
  "Original"
] as const;

// Room redesign request schema
export const roomRedesignRequestSchema = z.object({
  promptType: z.enum(promptTypes).default("room-scene"),
  preservedElements: z.string(),
  closeupFocus: z.string().optional(),

  // Multiple reference images for context
  referenceImages: z.array(z.string()).optional(),

  // Inspiration images for style/mood board
  inspirationImages: z.array(z.string()).optional(),

  // Single technical drawing
  referenceDrawing: z.string().optional(),

  // Structure analysis metadata
  structureAnalysis: z.string().nullish(), 

  // Angle restricted to Original
  viewAngle: z.enum(viewAngles).default("Original"),

  // Zoom Level (100% = Original)
  cameraZoom: z.number().min(50).max(200).default(100),

  targetStyle: z.enum(availableStyles),
  quality: z.enum(["Standard", "High Fidelity (2K)", "Ultra (4K)"]),
  aspectRatio: z.enum(["Original", "16:9", "1:1", "4:3"]),

  // UPDATED: Complexity slider mapped to 4 discrete points
  creativityLevel: z.number().min(1).max(4).default(2),

  outputFormat: z.enum(outputFormats).default("PNG"),
  batchSize: z.number().min(1).max(10).default(1),
  originalFileName: z.string().optional(),

  // Smart Zoom feature
  useSmartZoom: z.boolean().optional(),
  smartZoomObject: z.string().optional(),
  smartFillRatio: z.number().min(10).max(100).optional(),

  // Added elements for room design
  addedElements: z.string().optional(),
});

// Smart Crop Schema (unchanged)
export const smartCropRequestSchema = z.object({
  objectName: z.string().min(1, "Object name is required"),
  fillRatio: z.number().min(10).max(100).default(80), 
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:5", "Original"]),
});

// Dimensional Images - Product Types
export const productTypes = [
  "Shower",
  "Tub Shower", 
  "Shower Base",
  "Other",
] as const;

// Dimension Line Placement Options
export const heightPlacements = [
  "Left Side (Vertical)",
  "Right Side (Vertical)",
  "Left Panel Edge",
] as const;

export const widthPlacements = [
  "Front Bottom",
  "Front Top",
  "Below Product",
] as const;

export const depthPlacements = [
  "Left Side (Perspective)",
  "Right Side (Perspective)",
  "Top Edge (Perspective)",
] as const;

// Dimensional Image Request Schema
export const dimensionalImageRequestSchema = z.object({
  productType: z.enum(productTypes),
  productHeight: z.string().min(1, "Height is required"),
  productWidth: z.string().min(1, "Width is required"),
  productDepth: z.string().min(1, "Depth is required"),
  heightPlacement: z.enum(heightPlacements).default("Left Side (Vertical)"),
  widthPlacement: z.enum(widthPlacements).default("Front Bottom"),
  depthPlacement: z.enum(depthPlacements).default("Left Side (Perspective)"),
  productFillRatio: z.number().min(20).max(90).default(60),
  showTopLegend: z.boolean().default(true),
  showBottomDisclaimer: z.boolean().default(true),
});

export type RoomRedesignRequest = z.infer<typeof roomRedesignRequestSchema>;
export type SmartCropRequest = z.infer<typeof smartCropRequestSchema>;
export type DimensionalImageRequest = z.infer<typeof dimensionalImageRequestSchema>;

// Room redesign response schema
export interface RoomRedesignResponse {
  success: boolean;
  generatedImage?: string; 
  allImages?: string[];
  error?: string;
  variations?: string[];
  structureAnalysis?: string;
}

// Export auth schema (users and sessions tables)
export * from "./models/auth";

// Drizzle Tables
export const generatedDesigns = pgTable("generated_designs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),  // Optional user association for design history
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  originalImageUrl: text("original_image_url").notNull(),
  generatedImageUrl: text("generated_image_url").notNull(),
  originalFileName: text("original_file_name").notNull(),
  config: jsonb("config").notNull(),
  variations: jsonb("variations").$type<string[]>().default([]),
});

// Prompt Logging Table
export const promptLogs = pgTable("prompt_logs", {
  id: serial("id").primaryKey(),
  jobType: text("job_type").notNull(), 
  prompt: text("prompt").notNull(),
  parameters: jsonb("parameters"), 
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Type definitions
export type GeneratedDesign = typeof generatedDesigns.$inferSelect;
export type InsertGeneratedDesign = typeof generatedDesigns.$inferInsert;

export type PromptLog = typeof promptLogs.$inferSelect;
export type InsertPromptLog = typeof promptLogs.$inferInsert;