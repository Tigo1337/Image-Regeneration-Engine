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
] as const;

// Prompt types
export const promptTypes = ["room-scene"] as const;

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
  preservedElements: z.string(),
  addedElements: z.string().optional(),
  closeupFocus: z.string().optional(),

  // Allow uploading multiple reference images for 3D context
  referenceImages: z.array(z.string()).optional(),

  // Allow uploading a single technical drawing (PDF or Image)
  referenceDrawing: z.string().optional(),

  // Allow passing existing analysis to avoid re-generation
  structureAnalysis: z.string().nullish(), 

  // Angle for Rotation
  viewAngle: z.enum(viewAngles).default("Original"),

  // Standard Zoom Level (Legacy/Simple)
  cameraZoom: z.number().min(50).max(200).default(100),

  // [NEW] Smart Object Zoom parameters
  useSmartZoom: z.boolean().default(false),
  smartZoomObject: z.string().optional(),
  smartFillRatio: z.number().min(20).max(100).optional(), // % of width

  targetStyle: z.enum(availableStyles),
  quality: z.enum(["Standard", "High Fidelity (2K)", "Ultra (4K)"]),
  aspectRatio: z.enum(["Original", "16:9", "1:1", "4:3"]),
  creativityLevel: z.number().min(0).max(100),
  outputFormat: z.enum(outputFormats).default("PNG"),
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
  error?: string;
  variations?: string[];
  structureAnalysis?: string;
}

// Drizzle Tables
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

// Prompt Logging Table
export const promptLogs = pgTable("prompt_logs", {
  id: serial("id").primaryKey(),
  jobType: text("job_type").notNull(), 
  prompt: text("prompt").notNull(),
  parameters: jsonb("parameters"), 
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type GeneratedDesign = typeof generatedDesigns.$inferSelect;
export type InsertGeneratedDesign = typeof generatedDesigns.$inferInsert;

export type PromptLog = typeof promptLogs.$inferSelect;
export type InsertPromptLog = typeof promptLogs.$inferInsert;