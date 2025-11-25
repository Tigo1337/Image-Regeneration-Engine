import { z } from "zod";

// Room redesign request schema
export const roomRedesignRequestSchema = z.object({
  preservedElements: z.string().min(1, "Please specify elements to preserve"),
  targetStyle: z.enum([
    "Modern",
    "Contemporary", 
    "Boho",
    "Industrial",
    "Scandinavian",
    "Mid-Century Modern"
  ]),
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
