import { z } from "zod";
import { pgTable, text, serial, bigint, jsonb } from "drizzle-orm/pg-core";
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

// Room redesign request schema
export const roomRedesignRequestSchema = z.object({
  promptType: z.enum(promptTypes).default("room-scene"),
  preservedElements: z.string(),
  // NEW FIELD: Optional string for adding elements
  addedElements: z.string().optional(),
  targetStyle: z.enum(availableStyles),
  quality: z.enum(["Standard", "High Fidelity (2K)", "Ultra (4K)"]),
  aspectRatio: z.enum(["Original", "16:9", "1:1", "4:3"]),
  creativityLevel: z.number().min(0).max(100),
  outputFormat: z.enum(outputFormats).default("PNG"),
});

export type RoomRedesignRequest = z.infer<typeof roomRedesignRequestSchema>;

// Room redesign response schema
export interface RoomRedesignResponse {
  success: boolean;
  generatedImage?: string; // base64 data URL
  error?: string;
}

// Drizzle Tables
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
});

export const generatedDesigns = pgTable("generated_designs", {
  id: text("id").primaryKey(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  originalImage: text("original_image").notNull(),
  generatedImage: text("generated_image").notNull(),
  originalFileName: text("original_file_name").notNull(),
  config: jsonb("config").notNull(),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type GeneratedDesign = typeof generatedDesigns.$inferSelect;
export type InsertGeneratedDesign = typeof generatedDesigns.$inferInsert;