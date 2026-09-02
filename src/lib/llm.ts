import type { Settings } from "./types";

export interface ArticleResult {
  title: string;
  body: string;
  provider: string;
  model: string;
}

const GEMINI_MODELS = (process.env.GEMINI_MODEL ?? "gemini-2.5-flash,gemini-2.0-flash")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const OPENAI_MODELS = (process.env.OPENAI_MODEL ?? "gpt-4.1-mini,gpt-4o-mini")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function generateGemini(title: string, systemPrompt: string, key: string): Promise<ArticleResult> {
  let lastErr: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: `Write the article for the title: "${title}"` }] }],
            generationConfig: { temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(45_000),
        },
      );
      if (!res.ok) {
        lastErr = new Error(`${model}: ${res.status} ${(await res.text()).slice(0, 200)}`);
        continue;
      }
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ?? "";
      if (!text) {
        lastErr = new Error(`${model}: empty response`);
        continue;
      }
      return { title, body: text, provider: "gemini", model };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("all Gemini models failed");
}

async function generateOpenAI(title: string, systemPrompt: string, key: string): Promise<ArticleResult> {
  let lastErr: unknown;
  for (const model of OPENAI_MODELS) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Write the article for the title: "${title}"` },
          ],
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) {
        lastErr = new Error(`${model}: ${res.status} ${(await res.text()).slice(0, 200)}`);
        continue;
      }
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content ?? "";
      if (!text) {
        lastErr = new Error(`${model}: empty response`);
        continue;
      }
      return { title, body: text, provider: "openai", model };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("all OpenAI models failed");
}

/**
 * Deterministic stand-in so the pipeline can be reviewed with zero API
 * credentials configured. Seeded on the title, so it is repeatable. It is
 * clearly labelled — the demo never pretends a simulated article is real.
 */
function generateSimulated(title: string): ArticleResult {
  const paragraphs = [
    `${title} is a topic that deserves more than a surface-level treatment, and this piece walks through what actually matters — from the fundamentals David's readers expect, to the practical detail that keeps them on the page.`,
    `The first thing to understand is the "why." Most articles jump straight to advice without grounding the reader in the underlying problem. Here, we start with context: what changed, why it matters now, and what happens if you get it wrong.`,
    `Section: Getting the fundamentals right\nA clear structure beats clever writing. Short paragraphs, one idea per section, and a heading every few hundred words keep the reader oriented — which is exactly what the formatting pipeline below enforces automatically.`,
    `Section: Where most people go wrong\nThe common mistake is treating this as a one-time task rather than a recurring habit. David has covered this pattern before — worth a look if you want the deeper version of this idea.`,
    `Section: What to do next\nStart small, measure the result, and adjust. That is the entire playbook — everything else is detail. This is a simulated article body — no LLM key is configured — but the shape and formatting are exactly what a live generation would produce.`,
  ];
  return {
    title,
    body: paragraphs.join("\n\n"),
    provider: "simulator",
    model: "deterministic-v1",
  };
}

export async function activeProvider(settings: Settings): Promise<string> {
  if (settings.llm_provider === "gemini" && settings.gemini_api_key) return "gemini";
  if (settings.llm_provider === "openai" && settings.openai_api_key) return "openai";
  if (settings.gemini_api_key) return "gemini";
  if (settings.openai_api_key) return "openai";
  return "simulator";
}

export async function generateArticle(title: string, settings: Settings): Promise<ArticleResult> {
  const provider = await activeProvider(settings);
  try {
    if (provider === "gemini") return await generateGemini(title, settings.system_prompt, settings.gemini_api_key!);
    if (provider === "openai") return await generateOpenAI(title, settings.system_prompt, settings.openai_api_key!);
    return generateSimulated(title);
  } catch {
    return generateSimulated(title);
  }
}
