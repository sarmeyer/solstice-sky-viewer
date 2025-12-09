# Stella Chat API Spec

## Overview

Stella is a friendly and slightly whimsical “sky guide” that helps users
understand the objects visible in their night sky. After the user retrieves sky
objects for a given location/date, they can ask Stella questions and receive
natural language responses grounded in that data.

This API provides a backend endpoint for Stella’s chat behavior.

- Endpoint: `POST /api/stella-chat`
- Format: JSON request/response
- Auth: none (for now)
- Streaming: not supported (simple one-shot responses)

---

## User Story

As a user who just saw the list of visible sky objects for my location,  
I want to ask Stella questions about them (e.g., what they are, which to look at
first, historical or fun facts about the objects),  
so that I can better understand what I’m seeing in the sky.

---

## Goals

- Provide a **single chat endpoint** for Stella that:
  - Accepts location, date, visible sky objects, and chat messages.
  - Returns a single assistant reply per request.
- Keep Stella’s responses:
  - Friendly, beginner-friendly, and concise.
  - Grounded in the provided sky objects.
- Keep the implementation:
  - Independent of the UI (web, mobile, etc.).
  - Compatible with the existing `SkyObjectsSuccess` structure.

---

## Non-goals (v1)

- No streaming responses.
- No user authentication or personalization.
- No long-term conversation persistence on the server.
- No tools/plugins beyond the existing sky object data.

---

## Endpoint

### `POST /api/stella-chat`

Handles a single turn in the conversation between the user and Stella.

#### Request

**Headers**

- `Content-Type: application/json`

**Body**

```jsonc
{
  "location": "Denver, Colorado, USA",
  "date": "2025-12-21",
  "objects": [
    {
      "id": "jupiter",
      "name": "Jupiter",
      "type": "planet",
      "visibility": "good",
      "riseTime": "2025-12-21T19:03:00Z",
      "setTime": "2025-12-22T06:15:00Z",
      "note": "Bright in the southeast after sunset."
    }
  ],
  "messages": [
    {
      "role": "assistant",
      "content": "Hi, I’m Stella. What would you like to know about tonight’s sky?"
    },
    { "role": "user", "content": "What should I look at first?" }
  ]
}
```
