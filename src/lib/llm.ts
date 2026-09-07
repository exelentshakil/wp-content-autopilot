import type { Settings, AtoyanLegalContent, AtoyanFaq } from "./types";

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
Your job is to generate authoritative, deeply compelling California employment practice area content matching the exact conversational, punchy tone used by Atoyan Law.

CRITICAL TONE & FORMAT RULES:
1. PUNCHY PARAGRAPHS: Keep paragraphs very short (1 to 3 sentences max). Do not write dense walls of text.
2. SUBHEADINGS: Format subheadings as direct, relatable questions using <h2 class="h2dav"> and <h3 class="h3dav">.
3. EMPHASIS: Bold key phrases to guide the reader (e.g. <strong>That timeline matters.</strong>, <strong>First</strong>, <strong>Second</strong>).
4. CALIFORNIA LEGAL DEPTH: Mention specific California protections:
   - Fair Employment and Housing Act (FEHA)
   - California Civil Rights Department (CRD)
   - California Labor Code (e.g., § 98.6, § 1102.5 whistleblowing, § 203 waiting time penalties)
   - SB 497 (90-day rebuttable presumption of retaliation)
   - Yanowitz v. L'Oreal (broad totality of circumstances standard for adverse actions)
5. CALLOUT BOXES: In the servicesContent, include 2-3 signature Atoyan callout boxes formatted exactly as:
   <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Facing workplace retaliation or wrongful termination? That's not just unfair - it's illegal. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> or <a href="/contact/">contact us online</a> for a confidential consultation.</strong></em></p>
6. COMPREHENSIVE FAQS: Produce 8 to 10 practical, highly relevant FAQs answering real questions California employees have regarding this specific topic.
7. SEO METADATA: Provide optimized Yoast SEO title (under 60 chars), meta description (under 160 chars), focus keyword, and clean URL slug.

OUTPUT MUST BE VALID JSON with this exact schema:
{
  "keyword": "string",
  "city": "string",
  "slug": "string",
  "heroTitle": "string (Punchy title, e.g. Burbank Wrongful Termination Lawyer)",
  "servicesHeading": "string (e.g. What counts as an adverse employment action in California?)",
  "servicesSubHeading": "string (e.g. Proving Wrongful Termination & Retaliation)",
  "servicesContent": "string (Complete HTML body with <h2 class=\"h2dav\">, <h3 class=\"h3dav\">, <p>, <strong>, bullet points, and callout boxes)",
  "howDoHeading": "string (e.g. How to Stand Up for Your Rights After Unlawful Workplace Action)",
  "howDoContent": "string (Actionable HTML guidance: don't sign severance without advice, don't quit prematurely, save evidence)",
  "compensationHeading": "string (e.g. What Compensation Can You Recover in a California Employment Claim?)",
  "compensationIntro": "string (Detailed HTML explanation of lost wages, front pay, emotional distress, punitive damages, and attorney fee recovery)",
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

/**
 * Deterministic fallback content generator ensuring zero crashes if APIs are unavailable.
 */
function generateAtoyanSimulated(keyword: string, city: string): AtoyanLegalContent {
  const safeSlug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const heroTitle = `${keyword} | Atoyan Law Firm`;

  const faqs: AtoyanFaq[] = [
    {
      question: `What qualifies as unlawful workplace action in ${city}?`,
      answer:
        "Under California's Fair Employment and Housing Act (FEHA) and the Labor Code, an unlawful workplace action includes any adverse employment decision—such as termination, demotion, pay reduction, or retaliation—motivated by protected traits or protected employee activities.",
    },
    {
      question: "How long do I have to file an employment claim in California?",
      answer:
        "In California, employees generally have three years from the date of the unlawful conduct to file an administrative complaint with the Civil Rights Department (CRD). For wage claims with the Labor Commissioner (DLSE), statutes of limitations range from one to four years.",
    },
    {
      question: "Can an employer in California fire you for complaining about harassment?",
      answer:
        "No. California Labor Code § 1102.5 and FEHA explicitly prohibit retaliatory termination. Under California SB 497, if an adverse action occurs within 90 days of speaking out, the law creates a rebuttable presumption of retaliation.",
    },
    {
      question: "What is an 'adverse employment action' under California law?",
      answer:
        "As established in Yanowitz v. L'Oreal USA, an adverse employment action is any conduct that materially affects the terms, conditions, or privileges of employment, including schedule cuts, undesirable transfers, and unwarranted disciplinary warnings.",
    },
    {
      question: "What compensation can be recovered in a wrongful termination case?",
      answer:
        "Damages can include back pay, front pay, lost employee benefits, compensation for emotional distress, statutory penalties, and attorney fees under California Government Code § 12965.",
    },
    {
      question: "Should I sign a severance agreement if I was recently terminated?",
      answer:
        "Never sign a severance agreement or release of claims before having an employment attorney review it. Employers often offer severance to lock you out of substantial discrimination or retaliation claims.",
    },
    {
      question: "What evidence should I save if I suspect retaliation?",
      answer:
        "Save all performance reviews, emails, text messages, schedules, write-ups, and HR complaints. Keep personal notes documenting dates, witnesses, and changes in how management treated you.",
    },
    {
      question: "Does Atoyan Law Firm handle cases on a contingency fee basis?",
      answer:
        "Yes. Atoyan Law Firm handles employee rights and wrongful termination claims on contingency, meaning you pay zero upfront attorney fees unless we recover compensation for you.",
    },
  ];

  return {
    keyword,
    city,
    slug: safeSlug,
    heroTitle,
    servicesHeading: `What Counts as Unlawful Employment Action in ${city}?`,
    servicesSubHeading: `Proving Wrongful Termination & Retaliation Under California Law`,
    servicesContent: `
When employees in ${city} call an employment lawyer, they often know something feels wrong. They know their employer treated them differently. They know things changed after they complained, asked for medical accommodation, or stood up for their rights.

<h3 class="h3dav">Did your employer take an adverse employment action?</h3>

An adverse employment action is a negative job decision that harms your employment in a real way. It can affect your pay, title, schedule, duties, benefits, reputation, or working conditions.

It does not always mean termination. Getting fired is the clearest example, but many employees suffer damage long before they are let go. Hours get cut. Overtime disappears. Supervisors begin creating unfair write-ups.

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>If you experienced retaliation, discrimination, or wrongful termination in ${city}, call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> or <a href="/contact/">contact us online</a> to schedule a confidential legal consultation.</strong></em></p>

<h2 class="h2dav">Proving Unlawful Employment Practices in California</h2>

Proving unlawful employment action starts with showing what changed.

Before your protected activity, your record may have been clean. After speaking up, discipline began. Before you requested leave, your schedule was steady. After you asked, hours dropped.

<strong>That timeline matters.</strong>

In California employment cases, proof rarely comes from an email where an employer admits bad intent. It comes from patterns, timing, differential treatment, and inconsistent explanations. Under California SB 497, adverse action taken within 90 days of protected activity creates a rebuttable presumption of unlawful retaliation.

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Toxic workplace? Constant discrimination or retaliation? That's not just unfair - it's illegal. Atoyan Law Firm is ready to fight for you. <a href="tel:8888070077">Reach out now</a> to discuss your case.</strong></em></p>
`.trim(),
    howDoHeading: "How to Stand Up for Your Rights",
    howDoContent: `
<strong>Do not sign a severance agreement without legal advice</strong>. Employers may offer money quickly in exchange for a release of claims. Once you sign, you forfeit valuable legal rights.

<strong>Do not quit prematurely without legal consultation</strong>. If you resign too early, the employer will argue you left voluntarily. An attorney can assess whether the facts satisfy California's strict constructive discharge standard.

Most importantly, <strong>do not assume you have no case simply because you were not fired</strong>. Substantial reductions in hours, demotions, and retaliatory discipline are all actionable under California law.
`.trim(),
    compensationHeading: `How an Employment Lawyer Helps Recover Compensation in ${city}`,
    compensationIntro: `
A lawyer helps turn a confusing workplace story into a clear, compelling legal case.

At Atoyan Law Firm, we examine the full timeline. We identify the protected activity or protected trait, analyze what changed, review pay stubs, schedules, and personnel records, and aggressively pursue the maximum compensation available under California law.

Damages in California employment claims often include past and future lost earnings, compensation for emotional distress, statutory penalties, and attorney fees.
`.trim(),
    faqs,
    yoastTitle: `${keyword} | Atoyan Law Firm`,
    yoastMetaDesc: `Experienced ${keyword} fighting for California workers. Wrongful termination, retaliation & discrimination. Call (888) 807-0077 for a free consultation.`,
    yoastFocusKw: keyword,
  };
}

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
