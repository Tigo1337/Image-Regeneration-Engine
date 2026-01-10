import { constructRoomScenePrompt, styleDescriptions, PromptConfig, PromptType } from "@shared/prompt-logic";

export { styleDescriptions };
export type { PromptType };
export const availableStyles = Object.keys(styleDescriptions);

export function constructPrompt(config: PromptConfig): string {
  // Pass the configuration through to the unified shared logic
  return constructRoomScenePrompt(config);
}

export const promptTypes = [
  {
    value: "room-scene" as const,
    label: "Room Scene",
    description: "Transform the room design while preserving specific elements",
  },
];