/**
 * Appel au modèle de langage local (Gemma, servi par vLLM sur la machine GPU
 * Trooper), via le proxy privé llm-dev.mamifute.fr. API compatible OpenAI.
 * Aucune conversation ne quitte l'infrastructure.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function config() {
  const base = process.env.LLM_BASE_URL;
  const bearer = process.env.LLM_BEARER;
  if (!base || !bearer) throw new Error("LLM_BASE_URL / LLM_BEARER manquants");
  return { base, bearer, model: process.env.LLM_MODEL ?? "gemma-26b" };
}

/** Réponse en flux : renvoie un itérateur de fragments de texte. */
export async function* streamChat(messages: ChatMessage[], opts: { maxTokens?: number; temperature?: number } = {}) {
  const { base, bearer, model } = config();
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: opts.maxTokens ?? 600,
      temperature: opts.temperature ?? 0.8,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok || !res.body) throw new Error(`LLM ${res.status}: ${await res.text().catch(() => "")}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // ligne partielle ou keep-alive : ignorée
      }
    }
  }
}

/** Réponse complète (résumés, titres). */
export async function completeChat(messages: ChatMessage[], opts: { maxTokens?: number; temperature?: number } = {}) {
  const { base, bearer, model } = config();
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: opts.maxTokens ?? 400, temperature: opts.temperature ?? 0.3 }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const json = await res.json();
  return (json.choices?.[0]?.message?.content as string) ?? "";
}

/** Nettoie la sortie du modèle : tirets cadratins, Markdown résiduel. */
export function cleanText(text: string) {
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/\*\*?([^*]+)\*\*?/g, "$1")
    .replace(/^#+\s*/gm, "")
    .trim();
}
