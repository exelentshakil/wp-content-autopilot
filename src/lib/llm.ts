import { buildLinkingCatalogForLlm, trackPublishedArticle } from "./article-tracker";
import { injectInternalLinks, formatHowDoContentWithLinks, formatCompensationContentWithLinks, generateContextualCta } from "./seo-linking";
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

7. CRITICAL INTERNAL SEO LINKING (INTERNAL SEO JUICE):
   Every practice area page must actively harness and cross-link Atoyan Law Firm articles:
   - In servicesContent (Tab 2):
     Contextually weave 3 to 5+ natural internal links to related practice area and localized pages on atoyanlaw.com.
     Examples:
     * If you believe you were <a href="https://www.atoyanlaw.com/practice-areas/employment-law/overtime-pay/">not properly paid for overtime</a>, it is important...
     * An employer might reduce hours or <a href="https://www.atoyanlaw.com/practice-areas/employment-law/burbank-wrongful-termination-lawyer/">terminate their employment</a> after they complain...
     * Every <a href="https://www.atoyanlaw.com/practice-areas/employment-law/work-retaliation/">retaliation claim</a> depends on its particular facts...
     * DO NOT link to the current page itself (no self-links).
   - In howDoContent (Tab 4):
     Format with diagnostic questions including internal link:
     e.g., "Did the <a href=\"https://www.atoyanlaw.com/practice-areas/employment-law/work-retaliation/\">employer retaliate after the employee complained?</a>"
   - In compensationIntro (Tab 6):
     Must conclude with firm contact link:
     "If you believe your workplace rights were violated in [City], Atoyan Employment Law can help you evaluate your claim. <a href=\"/contact/\">Contact</a> the firm to discuss what happened and learn what options may be available to you."

8. 100% TOPIC-SPECIFIC CTAs & CALLOUT BOXES:
   ALL CTAs and callouts MUST be 100% relevant to the specific violation and city (never generic):
   - Early callout:
     <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>If your employer [topic-specific issue in City], Atoyan Law Firm is here to help. <a href="tel:8888070077">Contact our [City] [Topic] Attorneys</a> today for a free consultation and fight back for what you’ve earned.</strong></em></p>
   - Mid callout:
     <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>[Punchy topic questions]? You may be entitled to compensation. Our [City] [Topic] Lawyers are ready to fight for you. <a href="tel:8888070077">Reach out</a> now for your confidential case review.</strong></em></p>
   - Closing callout:
     <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>[Topic violation] is against the law. Don’t let your employer take advantage of you. <a href="tel:8888070077">Contact Atoyan Law Firm’s [City] [Topic] team</a> today and take the first step toward justice.</strong></em></p>

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
     Must be 2,500-3,500+ words of deep, high-authority California employment legal analysis ("strictly huge content").
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

5. DYNAMIC EASY ACCORDION & FAQS:
   Every single practice area page requires a brand-new, unique WordPress Easy Accordion created dynamically from its FAQs.
   Set "accordionShortcode" to "" (empty string) in your JSON output.
   DO NOT reuse old, existing, or hardcoded accordion IDs (such as 4176). The system will dynamically register a new WordPress sp_easy_accordion with your 8-10 FAQs.

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
  "servicesContent": "string (2,500-3,500+ words HTML with <h2 class=\"h2dav\">, <h3 class=\"h3dav\">, <p>, <strong>, <ul><li>, and topic-specific callout boxes)",
  "howDoHeading": "string",
  "howDoContent": "string",
  "compensationHeading": "string",
  "compensationIntro": "string (Rights intro and topic CTA with (747) 888-0077)",
  "accordionShortcode": "string (leave empty \"\" for dynamic creation)",
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

  const resolvedSlug =
    typeof obj.slug === "string" && obj.slug
      ? obj.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : sim.slug;
  const resolvedCity = typeof obj.city === "string" && obj.city ? obj.city : city;
  const rawServices = typeof obj.servicesContent === "string" && obj.servicesContent ? obj.servicesContent : sim.servicesContent;

  // Guarantee internal SEO linking on services content
  const linkedServices = injectInternalLinks(rawServices, {
    currentSlug: resolvedSlug,
    city: resolvedCity,
    maxLinks: 6,
  });

  // Guarantee How Do Section has strategic diagnostic question linking
  let finalHowDoContent = typeof obj.howDoContent === "string" && obj.howDoContent ? obj.howDoContent : sim.howDoContent;
  if (!finalHowDoContent.includes("<a href=") || !finalHowDoContent.includes("retaliat")) {
    finalHowDoContent = formatHowDoContentWithLinks({
      topic: keyword,
      city: resolvedCity,
      currentSlug: resolvedSlug,
    });
  }

  // Guarantee Compensation Section has contact link
  let finalCompIntro = typeof obj.compensationIntro === "string" && obj.compensationIntro ? obj.compensationIntro : sim.compensationIntro;
  if (!finalCompIntro.includes('href="/contact/"') && !finalCompIntro.includes('href="https://www.atoyanlaw.com/contact/"')) {
    finalCompIntro = finalCompIntro + " If you believe your rights were violated in " + resolvedCity + ', Atoyan Employment Law can evaluate your claim. <a href="/contact/">Contact</a> the firm to discuss what happened.';
  }

  const result: AtoyanLegalContent = {
    keyword: typeof obj.keyword === "string" && obj.keyword ? obj.keyword : keyword,
    city: resolvedCity,
    slug: resolvedSlug,
    heroTitle: typeof obj.heroTitle === "string" && obj.heroTitle ? obj.heroTitle : sim.heroTitle,
    servicesHeading:
      typeof obj.servicesHeading === "string" && obj.servicesHeading
        ? obj.servicesHeading
        : sim.servicesHeading,
    servicesSubHeading:
      typeof obj.servicesSubHeading === "string" && obj.servicesSubHeading
        ? obj.servicesSubHeading
        : sim.servicesSubHeading,
    servicesContent: linkedServices,
    howDoHeading:
      typeof obj.howDoHeading === "string" && obj.howDoHeading
        ? obj.howDoHeading
        : sim.howDoHeading,
    howDoContent: finalHowDoContent,
    compensationHeading:
      typeof obj.compensationHeading === "string" && obj.compensationHeading
        ? obj.compensationHeading
        : sim.compensationHeading,
    compensationIntro: finalCompIntro,
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

  // Dynamically record in article tracker for future cross-linking
  trackPublishedArticle({
    slug: result.slug,
    title: result.heroTitle,
    keyword: result.keyword,
    city: result.city,
    category: keyword.toLowerCase(),
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/" + result.slug + "/",
    publishedAt: new Date().toISOString(),
  });

  return result;
}

/**
 * Builds the effective system prompt by preserving ATOYAN_SYSTEM_PROMPT as the foundational legal schema
 * and cleanly appending custom attorney directives or ChatGPT conversation context.
 */
export function buildActiveSystemPrompt(customDirectives?: string, chatContext?: string): string {
  let prompt = ATOYAN_SYSTEM_PROMPT.trim();

  if (customDirectives && customDirectives.trim()) {
    const trimmed = customDirectives.trim();
    if (!prompt.includes(trimmed)) {
      prompt += `\n\nADDITIONAL ATTORNEY DIRECTIVES & PREFERENCES:\n${trimmed}`;
    }
  }

  if (chatContext && chatContext.trim()) {
    prompt += `\n\nCLIENT CHATGPT CONVERSATION CONTEXT & SPECIAL CASE NOTES:\n${chatContext.trim()}\n\nIntegrate the above discussion, specific California case citations, and nuances directly into the legal analysis while strictly maintaining the required JSON schema and 2,500-3,500+ words depth.`;
  }

  return prompt;
}

/**
 * Generates California employment legal content using OpenAI.
 */
async function generateAtoyanOpenAI(
  keyword: string,
  city: string,
  apiKey: string,
  systemPrompt?: string,
  chatContext?: string,
): Promise<AtoyanLegalContent> {
  const safeSlug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const linkCatalog = buildLinkingCatalogForLlm({ category: keyword, city, currentSlug: safeSlug });
  const prompt = `${linkCatalog}\n\nWrite comprehensive, authoritative California employment law practice area content (strictly huge content: 2,500-3,500+ words in servicesContent) for the target topic/keyword: "${keyword}" in ${city}.\nEnsure all sections match Atoyan Law Firm\x27s punchy, compassionate tone, question-based <h2 class="h2dav"> and <h3 class="h3dav"> subheadings, statutory depth (FEHA, Labor Code §§ 98.6, 201-203, 226.7, 510, 512, 1102.5, SB 497, case law), topic callouts, and 8-10 FAQs. Output valid JSON matching the schema.`;

  const activePrompt = buildActiveSystemPrompt(systemPrompt, chatContext);

  for (const model of OPENAI_MODELS) {
    try {
      console.log(`[Atoyan LLM] Calling OpenAI (${model}) for "${keyword}" in ${city}...`);
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
          max_tokens: 16000,
        }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[Atoyan LLM] OpenAI (${model}) returned HTTP ${res.status}:`, errBody.slice(0, 500));
        continue;
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.servicesContent === "string" &&
          parsed.servicesContent.trim().length > 500
        ) {
          console.log(`[Atoyan LLM] Successfully generated ${parsed.servicesContent.length} chars via OpenAI (${model})`);
          return validateAndNormalizeAtoyanContent(parsed, keyword, city);
        } else {
          console.warn(`[Atoyan LLM] OpenAI (${model}) response missing servicesContent or length <= 500`);
        }
      }
    } catch (err) {
      console.error(`[Atoyan LLM] OpenAI (${model}) request exception:`, err);
    }
  }

  throw new Error("OpenAI generation failed across all configured models");
}

/**
 * Generates California employment legal content using Gemini structured output.
 */
async function generateAtoyanGemini(
  keyword: string,
  city: string,
  apiKey: string,
  systemPrompt?: string,
  chatContext?: string,
): Promise<AtoyanLegalContent> {
  const safeSlug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const linkCatalog = buildLinkingCatalogForLlm({ category: keyword, city, currentSlug: safeSlug });
  const prompt = `${linkCatalog}\n\nTarget Topic: "${keyword}" in ${city}.\nWrite high-authority California employment legal practice area content (strictly huge content: 2,500-3,500+ words in servicesContent) for Atoyan Law Firm following all system guidelines. Output valid JSON matching the schema.`;

  const activePrompt = buildActiveSystemPrompt(systemPrompt, chatContext);

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[Atoyan LLM] Calling Gemini (${model}) for "${keyword}" in ${city}...`);
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
            maxOutputTokens: 16000,
          },
        }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[Atoyan LLM] Gemini (${model}) returned HTTP ${res.status}:`, errBody.slice(0, 500));
        continue;
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.servicesContent === "string" &&
          parsed.servicesContent.trim().length > 500
        ) {
          console.log(`[Atoyan LLM] Successfully generated ${parsed.servicesContent.length} chars via Gemini (${model})`);
          return validateAndNormalizeAtoyanContent(parsed, keyword, city);
        } else {
          console.warn(`[Atoyan LLM] Gemini (${model}) response missing servicesContent or length <= 500`);
        }
      }
    } catch (err) {
      console.error(`[Atoyan LLM] Gemini (${model}) request exception:`, err);
    }
  }

  throw new Error("Gemini generation failed across all configured models");
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
  chatContext?: string;
}): Promise<AtoyanLegalContent> {
  const { keyword, systemPrompt, chatContext } = params;
  const city = params.city || extractCity(keyword);

  // If simulator is explicitly chosen in settings, return simulated
  if (params.provider === "simulator") {
    console.log(`[Atoyan LLM] Simulator explicitly selected for "${keyword}"`);
    return generateAtoyanSimulated(keyword, city);
  }

  // Prioritize client-provided API keys (from Settings modal) over server environment keys
  const openaiKey = params.openaiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || undefined;
  const geminiKey = params.geminiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || undefined;

  let preferredProvider: "openai" | "gemini" = params.provider === "gemini" ? "gemini" : "openai";
  if (openaiKey && !geminiKey) preferredProvider = "openai";
  else if (geminiKey && !openaiKey) preferredProvider = "gemini";

  // Attempt 1: Preferred Provider
  if (preferredProvider === "openai" && openaiKey) {
    try {
      return await generateAtoyanOpenAI(keyword, city, openaiKey, systemPrompt, chatContext);
    } catch (e) {
      console.warn("[Atoyan LLM] Primary OpenAI attempt failed, falling back to Gemini / simulated:", e);
    }
  }

  if (preferredProvider === "gemini" && geminiKey) {
    try {
      return await generateAtoyanGemini(keyword, city, geminiKey, systemPrompt, chatContext);
    } catch (e) {
      console.warn("[Atoyan LLM] Primary Gemini attempt failed, falling back to OpenAI / simulated:", e);
    }
  }

  // Attempt 2: Secondary Provider Fallback
  if (openaiKey && preferredProvider !== "openai") {
    try {
      return await generateAtoyanOpenAI(keyword, city, openaiKey, systemPrompt, chatContext);
    } catch (e) {
      console.warn("[Atoyan LLM] Fallback OpenAI attempt failed:", e);
    }
  }

  if (geminiKey && preferredProvider !== "gemini") {
    try {
      return await generateAtoyanGemini(keyword, city, geminiKey, systemPrompt, chatContext);
    } catch (e) {
      console.warn("[Atoyan LLM] Fallback Gemini attempt failed:", e);
    }
  }

  // Attempt 3: Last resort offline simulator
  console.warn(`[Atoyan LLM] No AI API succeeded for "${keyword}" in ${city}. Using offline simulator as emergency fallback.`);
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
