/**
 * TypeScript types for the Sky Objects API
 * Generated from spec/sky-objects.md
 */

/**
 * Location information resolved from the query
 */
export type Location = {
  query: string;
  resolvedName: string;
  lat: number;
  lon: number;
};

/**
 * Type of celestial object
 */
export type SkyObjectType = "star" | "planet" | "constellation" | "other";

/**
 * Visibility quality of the celestial object
 */
export type Visibility = "good" | "ok" | "poor";

/**
 * A celestial object visible in the night sky
 */
export type SkyObject = {
  id: string;
  name: string;
  type: SkyObjectType;
  visibility: Visibility;
  riseTime: string; // ISO datetime string
  setTime: string; // ISO datetime string
  magnitude?: number; // optional
  note: string;
};

/**
 * Success response from the Sky Objects API
 */
export type SkyObjectsResponse = {
  location: Location;
  date: string; // ISO date
  objects: SkyObject[]; // 3-5 objects
};

/**
 * Error code values
 */
export type ErrorCode = "INVALID_LOCATION" | "UPSTREAM_ERROR" | "UNKNOWN";

/**
 * Error information
 */
export type ErrorInfo = {
  code: ErrorCode;
  message: string;
};

/**
 * Error response from the Sky Objects API
 */
export type SkyObjectsErrorResponse = {
  error: ErrorInfo;
};

