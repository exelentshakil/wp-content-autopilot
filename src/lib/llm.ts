import { generateAtoyanSimulated } from "./llm-simulated";
import type { Settings, AtoyanLegalContent, AtoyanFaq } from "./types";
import { resolveDefaultAccordionShortcode, ATOYAN_PHONE, ATOYAN_TOLL_FREE } from "./atoyan";

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

const OPENAI_MODELS = (process.env.OPENAI_MODEL ?? "gpt-4o,gpt-4o-mini")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ATOYAN_SYSTEM_PROMPT = `
You are the senior legal content strategist and employment litigation attorney at Atoyan Law Firm (atoyanlaw.com).
Your job is to generate authoritative, deeply compelling California employment practice area content matching the exact conversational, punchy tone and structure used by Atoyan Law.

CRITICAL CLIENT RULES (CLIENT DAVID - ATOYAN LAW FIRM):

1. TITLE FORMULA:
   Hero title MUST follow this exact formula:
   "[City] [Topic] Employment Lawyers - [Subtopic/Action]"
   Examples:
   - "Burbank Wrongful Termination Employment Lawyers - Unlawful Firing"
   - "Burbank Race Discrimination Employment Lawyers - Workplace Bias"
   - "Burbank Sexual Harassment Employment Lawyers - Hostile Work Environment"
   - "Burbank Wage Theft Employment Lawyers - Unpaid Wages & Overtime"
   - "Visalia Meal and Rest Break Employment Lawyers - Labor Violations"

2. THREE UNIQUE CONTENT SECTIONS (ACF TABS 2, 4, 6):
   - 1ST: SERVICES CONTENT (Tab 2 - servicesContent):
     Must be 2,000+ words of deep, high-authority California employment legal analysis.
     Analyze the exact topic under California law with thorough real-world scenarios, legal standards, employer tactics, employee rights, and evidence gathering.
     Structure with:
       * Short punchy paragraphs (1-3 sentences max). No dense walls of text.
       * Question-based subheadings formatted with <h2 class="h2dav"> and <h3 class="h3dav">.
       * Bold key phrases for readability (e.g. <strong>That timeline matters.</strong>, <strong>First</strong>, <strong>Second</strong>).
       * Bullet lists (<ul><li>...</li></ul>).
       * 2-3 topic-specific callout boxes (see rule 3 below).
       * California statutory depth (FEHA, CRD, Labor Code §§ 98.6, 203, 226.7, 510, 512, 1102.5, SB 497 90-day presumption, Gov Code § 12940, case law).
   - 2ND: HOW DO SECTION (Tab 4 - howDoHeading & howDoContent):
     Unique heading (e.g., "How Can a [City] [Topic] Lawyer at Atoyan Law Help?") and actionable guidance:
     Specific steps for an employee facing this exact issue (e.g. do not sign severance or releases without counsel, do not quit prematurely, how to preserve evidence, what damages are recoverable).
   - 3RD: COMPENSATION SECTION (Tab 6 - compensationHeading & compensationIntro):
     Unique heading (e.g., "What Results and Compensation Can I Expect from a California [Topic] Claim?")
     and compensation intro composed of:
     Paragraph 1: Employee rights regarding this topic with an internal link (e.g. You have the right to work in an environment free from unlawful discrimination. You have the right to <a href="https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/">report discrimination</a> without losing your job...).
     Paragraph 2: Impact statement and topic-tailored CTA:
       "[Topic] takes a toll on everything. Your career. Your income. Your dignity. Your family. But California law gives you tools to fight back. If you experienced [topic] in [City], call us. Atoyan Law offers confidential consultations. No pressure. Real answers. Call <a href=\"tel:747888-0077\">(747) 888-0077</a> or contact us online to schedule a free consultation with our <b>[City] [topic] lawyers</b>."

3. STRICT TOPIC-SPECIFIC CTAs & CALLOUT BOXES:
   CTAs and Callout Boxes must be 100% relevant to the specific practice area.
   DO NOT use generic wrongful termination copy if the topic is race discrimination, wage theft, sexual harassment, meal breaks, or disability.
   Format callout boxes as:
   <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>[Topic-specific problem in City]? That's not just unfair - it's illegal. Call Atoyan Law at <a href="tel:747888-0077">(747) 888-0077</a> or <a href="/contact/">contact us online</a> to schedule a confidential legal consultation.</strong></em></p>

4. COMPREHENSIVE TOPIC-SPECIFIC FAQS:
   Produce 8 to 10 practical, in-depth FAQs directly addressing real employee questions about this EXACT topic.
   No generic filler FAQs.

5. EASY ACCORDION SHORTCODE:
   Set accordionShortcode to the appropriate WordPress shortcode matching the topic, e.g. [sp_easyaccordion id="4355"] for race discrimination, [sp_easyaccordion id="4200"] for hostile work environment, [sp_easyaccordion id="4176"] for wrongful termination, [sp_easyaccordion id="4167"] for wage theft, [sp_easyaccordion id="4119"] for meal/rest breaks, [sp_easyaccordion id="3894"] for disability, etc.

6. SEO METADATA:
   Yoast title (< 60 chars), meta description (< 160 chars), focus keyword, clean URL slug.

OUTPUT MUST BE VALID JSON with this exact schema:
{
  "keyword": "string",
  "city": "string",
  "slug": "string",
  "heroTitle": "string ([City] [Topic] Employment Lawyers - [Subtopic])",
  "servicesHeading": "string",
  "servicesSubHeading": "string",
  "servicesContent": "string (2,000+ words HTML with <h2 class=\"h2dav\">, <h3 class=\"h3dav\">, <p>, <strong>, <ul><li>, and topic-specific callout boxes)",
  "howDoHeading": "string",
  "howDoContent": "string",
  "compensationHeading": "string",
  "compensationIntro": "string (Rights intro and topic CTA with (747) 888-0077)",
  "accordionShortcode": "string (e.g. [sp_easyaccordion id=\"4355\"])",
  "faqs": [
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "yoastTitle": "string",
  "yoastMetaDesc": "string",
  "yoastFocusKw": "string"
}
`;

/**
 * Extracts city from keyword or defaults to California.
 */
export function extractCity(keyword: string): string {
  const commonCities = [
    "Burbank",
    "Los Angeles",
    "Glendale",
    "Pasadena",
    "Visalia",
    "Fresno",
    "Van Nuys",
    "Studio City",
    "North Hollywood",
    "Long Beach",
    "San Fernando Valley",
    "Orange County",
    "Bakersfield",
    "Sacramento",
    "San Francisco",
    "San Diego",
  ];
  for (const city of commonCities) {
    if (new RegExp(`\\b${city}\\b`, "i").test(keyword)) {
      return city;
    }
  }
  return "California";
}

/**
 * Validates and normalizes parsed LLM output, falling back to guaranteed high-quality defaults for any missing fields.
 */
function validateAndNormalizeAtoyanContent(
  raw: unknown,
  keyword: string,
  city: string,
): AtoyanLegalContent {
  const sim = generateAtoyanSimulated(keyword, city);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return sim;
  }

  const obj = raw as Record<string, unknown>;

  const faqs: AtoyanFaq[] =
    Array.isArray(obj.faqs) && obj.faqs.length > 0
      ? obj.faqs
          .filter((f) => f && typeof f === "object")
          .map((f) => {
            const item = f as Record<string, unknown>;
            return {
              question: String(item.question || "").trim(),
              answer: String(item.answer || "").trim(),
            };
          })
          .filter((f) => f.question && f.answer)
      : sim.faqs;

  const finalFaqs = faqs.length > 0 ? faqs : sim.faqs;

  return {
    keyword: typeof obj.keyword === "string" && obj.keyword ? obj.keyword : keyword,
    city: typeof obj.city === "string" && obj.city ? obj.city : city,
    slug:
      typeof obj.slug === "string" && obj.slug
        ? obj.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : sim.slug,
    heroTitle: typeof obj.heroTitle === "string" && obj.heroTitle ? obj.heroTitle : sim.heroTitle,
    servicesHeading:
      typeof obj.servicesHeading === "string" && obj.servicesHeading
        ? obj.servicesHeading
        : sim.servicesHeading,
    servicesSubHeading:
      typeof obj.servicesSubHeading === "string" && obj.servicesSubHeading
        ? obj.servicesSubHeading
        : sim.servicesSubHeading,
    servicesContent:
      typeof obj.servicesContent === "string" && obj.servicesContent
        ? obj.servicesContent
        : sim.servicesContent,
    howDoHeading:
      typeof obj.howDoHeading === "string" && obj.howDoHeading
        ? obj.howDoHeading
        : sim.howDoHeading,
    howDoContent:
      typeof obj.howDoContent === "string" && obj.howDoContent
        ? obj.howDoContent
        : sim.howDoContent,
    compensationHeading:
      typeof obj.compensationHeading === "string" && obj.compensationHeading
        ? obj.compensationHeading
        : sim.compensationHeading,
    compensationIntro:
      typeof obj.compensationIntro === "string" && obj.compensationIntro
        ? obj.compensationIntro
        : sim.compensationIntro,
    faqs: finalFaqs,
    yoastTitle:
      typeof obj.yoastTitle === "string" && obj.yoastTitle ? obj.yoastTitle : sim.yoastTitle,
    yoastMetaDesc:
      typeof obj.yoastMetaDesc === "string" && obj.yoastMetaDesc
        ? obj.yoastMetaDesc
        : sim.yoastMetaDesc,
    yoastFocusKw:
      typeof obj.yoastFocusKw === "string" && obj.yoastFocusKw
        ? obj.yoastFocusKw
        : sim.yoastFocusKw,
    accordionShortcode:
      typeof obj.accordionShortcode === "string" && obj.accordionShortcode
        ? obj.accordionShortcode
        : sim.accordionShortcode,
  };
}

/**
 * Generates California employment legal content using OpenAI.
 */
async function generateAtoyanOpenAI(
  keyword: string,
  city: string,
  apiKey: string,
  systemPrompt?: string,
): Promise<AtoyanLegalContent> {
  const prompt = `Write comprehensive, California employment law practice area content for the target topic/keyword: "${keyword}" in ${city}.\nEnsure all sections match Atoyan Law Firm's punchy, compassionate tone and include 8-10 FAQs.`;
  const activePrompt =
    systemPrompt && !systemPrompt.includes("David") && systemPrompt.includes("Atoyan")
      ? systemPrompt.trim()
      : ATOYAN_SYSTEM_PROMPT;

  for (const model of OPENAI_MODELS) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: activePrompt },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.65,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!res.ok) continue;
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return validateAndNormalizeAtoyanContent(parsed, keyword, city);
      }
    } catch {
      // Fall through to next model or Gemini
    }
  }

  throw new Error("OpenAI generation failed");
}

/**
 * Generates California employment legal content using Gemini structured output.
 */
async function generateAtoyanGemini(
  keyword: string,
  city: string,
  apiKey: string,
  systemPrompt?: string,
): Promise<AtoyanLegalContent> {
  const prompt = `Target Topic: "${keyword}" in ${city}.\nWrite high-authority California employment legal practice area content for Atoyan Law Firm following all system guidelines. Output valid JSON.`;
  const activePrompt =
    systemPrompt && !systemPrompt.includes("David") && systemPrompt.includes("Atoyan")
      ? systemPrompt.trim()
      : ATOYAN_SYSTEM_PROMPT;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: activePrompt }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.65,
          },
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!res.ok) continue;
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        return validateAndNormalizeAtoyanContent(parsed, keyword, city);
      }
    } catch {
      // Fall through
    }
  }

  throw new Error("Gemini generation failed");
}

export { generateAtoyanSimulated } from "./llm-simulated";

/**
 * Main legal content generation function with automatic provider hierarchy.
 */
export async function generateAtoyanContent(params: {
  keyword: string;
  city?: string;
  openaiKey?: string;
  geminiKey?: string;
  provider?: "openai" | "gemini" | "simulator";
  systemPrompt?: string;
}): Promise<AtoyanLegalContent> {
  const { keyword, systemPrompt } = params;
  const city = params.city || extractCity(keyword);

  // If simulator is explicitly chosen, skip external API calls immediately
  if (params.provider === "simulator") {
    return generateAtoyanSimulated(keyword, city);
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim() || params.openaiKey?.trim() || undefined;
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || params.geminiKey?.trim() || undefined;

  let provider: "openai" | "gemini" = params.provider === "gemini" ? "gemini" : "openai";
  if (openaiKey && !geminiKey) provider = "openai";
  else if (geminiKey && !openaiKey) provider = "gemini";

  if (provider === "openai" && openaiKey) {
    try {
      return await generateAtoyanOpenAI(keyword, city, openaiKey, systemPrompt);
    } catch (e) {
      console.warn("OpenAI generation failed, falling back to Gemini / simulated:", e);
    }
  }

  if (provider === "gemini" && geminiKey) {
    try {
      return await generateAtoyanGemini(keyword, city, geminiKey, systemPrompt);
    } catch (e) {
      console.warn("Gemini generation failed, falling back to OpenAI / simulated:", e);
    }
  }

  // Provider fallbacks if primary failed or key not set
  if (openaiKey && provider !== "openai") {
    try {
      return await generateAtoyanOpenAI(keyword, city, openaiKey, systemPrompt);
    } catch (e) {
      console.warn("OpenAI fallback failed:", e);
    }
  }

  if (geminiKey && provider !== "gemini") {
    try {
      return await generateAtoyanGemini(keyword, city, geminiKey, systemPrompt);
    } catch (e) {
      console.warn("Gemini fallback failed:", e);
    }
  }

  return generateAtoyanSimulated(keyword, city);
}

// -----------------------------------------------------------------------------
// LEGACY COMPATIBILITY FUNCTIONS (for standard article generation)
// -----------------------------------------------------------------------------

export async function activeProvider(settings?: Settings): Promise<string> {
  if (settings?.llm_provider === "openai" && (settings.openai_api_key || process.env.OPENAI_API_KEY))
    return "openai";
  if (settings?.llm_provider === "gemini" && (settings.gemini_api_key || process.env.GEMINI_API_KEY))
    return "gemini";
  if (settings?.openai_api_key || process.env.OPENAI_API_KEY) return "openai";
  if (settings?.gemini_api_key || process.env.GEMINI_API_KEY) return "gemini";
  return "simulator";
}

export async function generateArticle(title: string, settings: Settings): Promise<ArticleResult> {
  const provider = await activeProvider(settings);
  const city = extractCity(title);
  try {
    const atoyan = await generateAtoyanContent({
      keyword: title,
      city,
      openaiKey: settings.openai_api_key,
      geminiKey: settings.gemini_api_key,
      provider: provider as "openai" | "gemini" | "simulator",
    });

    return {
      title,
      body: `${atoyan.servicesContent}\n\n${atoyan.howDoContent}\n\n${atoyan.compensationIntro}`,
      provider,
      model: provider === "openai" ? "gpt-4o" : provider === "gemini" ? "gemini-2.5-flash" : "deterministic",
    };
  } catch {
    const sim = generateAtoyanSimulated(title, city);
    return {
      title,
      body: `${sim.servicesContent}\n\n${sim.howDoContent}\n\n${sim.compensationIntro}`,
      provider: "simulator",
      model: "deterministic-v1",
    };
  }
}
