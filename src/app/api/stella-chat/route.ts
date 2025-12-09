import { NextRequest, NextResponse } from "next/server";
import type {
  StellaChatRequest,
  StellaChatSuccess,
  StellaChatError,
} from "../../../../types/stellaChat";
import type { SkyObject } from "../../../../types/skyObjects";
import { callStellaModel } from "../../../lib/stella/callStellaModel";

/**
 * Validates the request body according to the spec
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
  // Check location
  if (!body.location || typeof body.location !== "string" || body.location.trim() === "") {
    return { valid: false, error: "location is required and must be a non-empty string" };
  }

  // Check date
  if (!body.date || typeof body.date !== "string") {
    return { valid: false, error: "date is required and must be a string" };
  }
  // Validate ISO date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(body.date)) {
    return { valid: false, error: "date must be a valid ISO date (YYYY-MM-DD)" };
  }

  // Check objects
  if (!Array.isArray(body.objects)) {
    return { valid: false, error: "objects is required and must be an array" };
  }
  if (body.objects.length === 0) {
    return { valid: false, error: "objects array must contain at least one object" };
  }

  // Check messages
  if (!Array.isArray(body.messages)) {
    return { valid: false, error: "messages is required and must be an array" };
  }
  if (body.messages.length === 0) {
    return { valid: false, error: "messages array must contain at least one message" };
  }

  // Check that at least one message has role "user"
  const hasUserMessage = body.messages.some(
    (msg: any) => msg.role === "user"
  );
  if (!hasUserMessage) {
    return { valid: false, error: "messages array must contain at least one message with role 'user'" };
  }

  // Validate each message
  for (let i = 0; i < body.messages.length; i++) {
    const msg = body.messages[i];
    if (!msg.role || (msg.role !== "user" && msg.role !== "assistant")) {
      return { valid: false, error: `messages[${i}].role must be either "user" or "assistant"` };
    }
    if (!msg.content || typeof msg.content !== "string" || msg.content.trim() === "") {
      return { valid: false, error: `messages[${i}].content must be a non-empty string` };
    }
  }

  return { valid: true };
}

/**
 * Finds a suggested object ID from the objects array
 * Returns the first object with "good" visibility, or undefined
 */
function findSuggestedObjectId(objects: SkyObject[]): string | undefined {
  const goodVisibilityObject = objects.find((obj) => obj.visibility === "good");
  return goodVisibilityObject?.id;
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      const errorResponse: StellaChatError = {
        error: {
          code: "BAD_REQUEST",
          message: "Invalid JSON in request body",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      const errorResponse: StellaChatError = {
        error: {
          code: "BAD_REQUEST",
          message: validation.error || "Invalid request",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { location, date, objects, messages } = body as StellaChatRequest;

    const requestData: StellaChatRequest = {
      location,
      date,
      objects,
      messages,
    };

    // Call LLM model
    let reply: string;
    try {
      reply = await callStellaModel(requestData);
    } catch (error) {
      // Model call failed - return 502 with MODEL_ERROR
      const errorResponse: StellaChatError = {
        error: {
          code: "MODEL_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate response",
        },
      };
      return NextResponse.json(errorResponse, { status: 502 });
    }

    // Build response
    const suggestedObjectId = findSuggestedObjectId(objects);
    const response: StellaChatSuccess = {
      reply,
      ...(suggestedObjectId && { meta: { suggestedObjectId } }),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Unexpected error - return 500 with INTERNAL_ERROR
    const errorResponse: StellaChatError = {
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

