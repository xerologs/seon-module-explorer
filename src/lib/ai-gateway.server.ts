// Server-only helper that calls the Lovable AI Gateway (OpenAI-compatible).
// Never import this from the client bundle.

export type ChatMsg = { role: "system" | "user" | "assistant" | "tool"; content: string };

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export async function chatComplete(messages: ChatMsg[], model = DEFAULT_MODEL): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured on server");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.85,
    }),
  });

  if (res.status === 402) throw new Error("AI credits exhausted — top up Lovable AI credits in workspace billing.");
  if (res.status === 429) throw new Error("AI rate-limited. Slow down and try again.");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}
