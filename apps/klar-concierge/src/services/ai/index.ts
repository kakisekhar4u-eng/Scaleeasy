import { config } from "@/lib/config";
import { FallbackAIProvider } from "./fallbackExtractor";
import { OpenAIProvider } from "./openaiProvider";
import type { AIProvider } from "./types";

let cached: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (!cached) {
    cached =
      config.enableAIPersonalisation && config.openaiApiKey
        ? new OpenAIProvider(config.openaiApiKey, config.openaiModel)
        : new FallbackAIProvider();
  }
  return cached;
}

export type { AIProvider } from "./types";
