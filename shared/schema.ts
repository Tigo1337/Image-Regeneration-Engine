import { z } from "zod";

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

// Room redesign request schema
export const roomRedesignRequestSchema = z.object({
  promptType: z.enum(promptTypes).default("room-scene"),
  preservedElements: z.string(),
  targetStyle: z.enum(availableStyles),
  quality: z.enum(["Standard", "High Fidelity (2K)", "Ultra (4K)"]),
  aspectRatio: z.enum(["Original", "16:9", "1:1", "4:3"]),
  creativityLevel: z.number().min(0).max(100),
});

export type RoomRedesignRequest = z.infer<typeof roomRedesignRequestSchema>;

// Room redesign response schema
export interface RoomRedesignResponse {
  success: boolean;
  generatedImage?: string; // base64 data URL
  error?: string;
}

// Generated design for history
export interface GeneratedDesign {
  id: string;
  timestamp: number;
  originalImage: string; // base64 data URL
  generatedImage: string; // base64 data URL
  originalFileName: string;
  config: RoomRedesignRequest;
}
