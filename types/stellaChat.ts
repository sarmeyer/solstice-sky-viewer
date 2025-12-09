/**
 * TypeScript types for the Stella Chat API
 * Generated from spec/stella-chat.md
 */

import type { SkyObject } from "./skyObjects";

/**
 * A message in the conversation between user and Stella
 */
export type StellaChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Request body for POST /api/stella-chat
 */
export type StellaChatRequest = {
  location: string;
  date: string; // ISO date
  objects: SkyObject[];
  messages: StellaChatMessage[];
};

/**
 * Success response from the Stella Chat API
 */
export type StellaChatSuccess = {
  reply: string;
  meta?: {
    suggestedObjectId?: string;
  };
};

/**
 * Error code values for Stella Chat API
 */
export type StellaChatErrorCode = "BAD_REQUEST" | "MODEL_ERROR" | "INTERNAL_ERROR";

/**
 * Error information for Stella Chat API
 */
export type StellaChatErrorInfo = {
  code: StellaChatErrorCode;
  message: string;
};

/**
 * Error response from the Stella Chat API
 */
export type StellaChatError = {
  error: StellaChatErrorInfo;
};

