import type {
  StellaChatMessage,
  StellaChatRequest,
} from "../../../types/stellaChat"

const STELLA_SYSTEM_PROMPT = `
You are Stella, a friendly stargazing guide.

The user has provided:
- Their location
- The current date
- A short list of visible sky objects for tonight

Your job:
- Explain what these objects are in simple, beginner-friendly language
- Suggest which object(s) are good to look at and why
- Give practical tips for finding them in the sky when relevant

Tone:
- Warm, encouraging, and concise
- Assume the user is curious but not an expert
- Avoid heavy jargon; if you must use a term, explain it briefly
- With a tiny dash of celestial poetry and a touch of whimsy

Grounding:
- Base your answers on the provided sky objects, location, and date
- If the user asks about an object that is NOT in the provided list, say so gently and redirect to objects that ARE in the list
- 1–4 sentences per reply is ideal
`

function buildContextFromRequest(req: StellaChatRequest): string {
  const lines: string[] = []

  lines.push(`Location: ${req.location}`)
  lines.push(`Date: ${req.date}`)
  lines.push(`Visible objects:`)

  if (req.objects.length === 0) {
    lines.push(`(none provided)`)
  } else {
    for (const obj of req.objects) {
      lines.push(
        `- ${obj.name} (${obj.type}, visibility: ${obj.visibility}) – ${obj.note}`
      )
    }
  }

  return lines.join("\n")
}

/**
 * Calls the underlying LLM for Stella and returns a text reply.
 */
export async function callStellaModel(req: StellaChatRequest): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY")
  }

  // Build messages for the model
  const context = buildContextFromRequest(req)

  const modelMessages = [
    {
      role: "system",
      content: STELLA_SYSTEM_PROMPT.trim(),
    },
    {
      role: "system",
      content: `Context:\n${context}`,
    },
    // user + assistant history from the client
    ...req.messages.map((m: StellaChatMessage) => ({
      role: m.role,
      content: m.content,
    })),
  ] as const

  // --- Actual LLM call ---
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: modelMessages,
      temperature: 0.8,
      max_tokens: 300,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Model error: ${response.status} ${text}`)
  }

  const json = await response.json()
  const reply =
    json.choices?.[0]?.message?.content?.trim() ||
    "Sorry, I couldn’t think of a good answer just now."

  return reply
}
