import { buildLinkingCatalogForLlm, trackPublishedArticle } from "./article-tracker";
import { decomposeKeyword } from "./keyword-utils";
import { injectInternalLinks, formatHowDoContentWithLinks, formatCompensationContentWithLinks, generateContextualCta } from "./seo-linking";
import { generateAtoyanSimulated, buildStatutoryDeadlineTableHtml } from "./llm-simulated";
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

const OPENAI_MODELS = (process.env.OPENAI_MODEL ?? "chatgpt-4o-latest,gpt-4o,o3-mini")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function cleanApiKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().replace(/^["'\s]+|["'\s]+$/g, "");
  return cleaned.length > 5 ? cleaned : undefined;
}

const ATOYAN_SYSTEM_PROMPT = `
You are the senior legal content strategist and employment litigation attorney at Atoyan Law Firm (atoyanlaw.com).
Your job is to generate authoritative, deeply compelling California employment practice area content matching the exact conversational, punchy tone and structure used by Atoyan Law and attorney David Atoyan.

CRITICAL CLIENT RULES (CLIENT DAVID - ATOYAN LAW FIRM):

1. TITLE & DECOMPOSITION FORMULA:
   Hero title MUST follow this exact formula without keyword repetition or phrase doubling:
   "[City] [Topic] Employment Lawyers - [Subtopic/Action]"
   Examples:
   - "Burbank Wrongful Termination Employment Lawyers - Unlawful Firing"
   - "Glendale Race Discrimination Employment Lawyers - Workplace Bias"
   - "Burbank Sexual Harassment Employment Lawyers - Hostile Work Environment"
   - "Burbank Wage Theft Employment Lawyers - Unpaid Wages & Overtime"
   - "Visalia Meal and Rest Break Employment Lawyers - Labor Violations"
   - "Pasadena Disability Discrimination Employment Lawyers - Failure to Accommodate"
   - "Burbank Medical and Family Leave Employment Lawyers - CFRA Violations"
   - "Glendale Workplace Retaliation Employment Lawyers - Whistleblower Protection"
   NEVER double phrases like "Glendale Glendale Wrongful Termination Lawyer Lawyer". Isolate City and Topic cleanly.

2. CONVERSATIONAL, WORKER-FIRST TONE (DAVID ATOYAN GOLD STANDARD):
   Replicate the conversational, empathetic, worker-first tone of David's live Burbank Overtime article:
   - Use conversational, question-based H2/H3 subheadings written as direct questions that anxious California workers ask:
     e.g., "What is overtime under California law?", "When should a Burbank employee receive time-and-a-half pay?", "Can an employer require me to work overtime without paying me?", "What if my employer asks me to work off the clock?", "What if my employer says I am salaried?", "Can undocumented workers recover unpaid overtime?", "What if I was forced to quit?".
   - Include concrete arithmetic calculations and numbers for wage, overtime, meal/rest break, and waiting time scenarios:
     * $25.00/hour regular rate -> $37.50/hour overtime (1.5x), $50.00/hour double time (2.0x).
     * Off-the-clock cumulative math: 20 minutes/day off the clock unpaid = 1.5 hours/week = $3,600+ per year in stolen wages.
     * Labor Code § 226.7 break premiums: 1 hour regular rate per missed meal or rest break = $25 to $50/day = up to $11,000+ per year.
     * Labor Code § 203 waiting time penalties: up to 30 days of full wages = e.g., 30 days × 8 hours × $25/hr = $6,000 in statutory penalties on top of unpaid wages.
   - Explicitly highlight California Labor Code § 1171.5 protections for undocumented workers: all California workers have full legal rights and remedies under labor and civil rights statutes regardless of immigration status. Threats to report to ICE or contact immigration authorities violate Labor Code § 244 and constitute criminal extortion and actionable retaliation.

3. THREE UNIQUE CONTENT SECTIONS (ACF TABS 2, 4, 6):
   - 1ST: SERVICES CONTENT (Tab 2 - servicesContent):
     Must be 2,500-3,500+ words of deep, high-authority California employment legal analysis ("strictly huge content").
     Structure with:
       * Short punchy paragraphs (1-3 sentences max). No dense walls of text.
       * Question-based subheadings formatted with <h2 class="h2dav"> and <h3 class="h3dav">.
       * Bold key phrases for readability (e.g. <strong>That timeline matters.</strong>, <strong>First</strong>, <strong>Second</strong>).
       * Bullet lists (<ul><li>...</li></ul>) and numbered lists (<ol><li>...</li></ol>).
       * 3 topic-specific callout boxes (Early, Mid, and Closing).
       * California statutory depth (FEHA Gov Code § 12940, CRD, Labor Code §§ 98.6, 201-203, 226.7, 510, 512, 1102.5, SB 497 90-day presumption, CROWN Act SB 188, case law).

     MANDATORY 7-SECTION LEGAL LITIGATION FRAMEWORK:
     * SECTION 1: STATUTORY FRAMEWORK & DEFINITIONS UNDER CALIFORNIA LAW
       Heading: <h2 class="h2dav">Understanding [Topic] Under California Law: Rights, Definitions, and Statutory Protections</h2>
       Detail FEHA Gov Code § 12940, protected classes, strict supervisor liability vs coworker negligence under Gov Code § 12940(j), Labor Code protections.
       Include Early Callout Box:
       <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>If your employer has subjected you to [topic] in [City], Atoyan Law Firm is here to fight for your rights. <a href="tel:8888070077">Contact our [City] [Topic] Attorneys</a> at (888) 807-0077 today for a free, confidential case evaluation.</strong></em></p>

     * SECTION 2: WORKPLACE MANIFESTATIONS & UNLAWFUL CONDUCT IN [CITY]
       Heading: <h2 class="h2dav">Common Forms of [Topic] in California Workplaces</h2>
       Subheadings with <h3 class="h3dav"> for Direct vs Disparate Impact, Adverse Actions, Hostile Work Environment standards.
       Include <ul> bullet list with 6-8 real-world workplace scenarios specific to the industry in [City] (entertainment, logistics, healthcare, tech, retail, hospitality).

     * SECTION 3: EMPLOYER PRETEXT, SHAM INVESTIGATIONS & PAPER TRAILS
       Heading: <h2 class="h2dav">How California Employers Mask [Topic]: Pretext, Paper Trails, and Sham HR Investigations</h2>
       Detail McDonnell Douglas / Guz v. Bechtel National burden-shifting, bogus write-ups right after complaints, sudden restructuring/RIFs, HR bias.
       Include Mid Callout Box:
       <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Facing sudden write-ups, bogus disciplinary reviews, or employer retaliation in [City]? You have legal rights under California law. Our [City] [Topic] Lawyers are prepared to hold them accountable. <a href="tel:8888070077">Call (888) 807-0077</a> for an immediate consultation.</strong></em></p>

     * SECTION 4: WORKPLACE RETALIATION & CALIFORNIA'S STATUTORY 90-DAY PRESUMPTION
       Heading: <h2 class="h2dav">Workplace Retaliation Under California Law: Labor Code § 1102.5 & Senate Bill 497</h2>
       Analyze Labor Code § 1102.5, § 98.6, and SB 497's 90-day rebuttable presumption of retaliation. Contrast California's Lawson standard with federal law.

     * SECTION 5: EVIDENTIARY BLUEPRINT: HOW TO DOCUMENT & PROVE YOUR CASE
       Heading: <h2 class="h2dav">How to Document and Prove a [Topic] Claim in California</h2>
       Subheadings with <h3 class="h3dav"> on Documentary Evidence, Digital Communications, Comparator Evidence, and Journaling.
       Preserve emails, texts, Slack/Teams, paystubs. Caution regarding California Penal Code § 632 two-party consent wiretapping.

     * SECTION 6: ADMINISTRATIVE FILINGS & CRITICAL STATUTES OF LIMITATIONS
       Heading: <h2 class="h2dav">California Civil Rights Department (CRD), EEOC Filings, and Deadlines</h2>
       Explain Gov Code § 12960 administrative exhaustion with CRD, immediate Right-to-Sue, 3-year CRD filing deadline (Gov Code § 12960(e)), and 1 year to sue in Superior Court. Labor Commissioner / DLSE wage claim deadlines.

     * SECTION 7: RECOVERABLE DAMAGES AND FINANCIAL COMPENSATION
       Heading: <h2 class="h2dav">What Compensation and Financial Damages Can You Recover in California?</h2>
       Subheadings with <h3 class="h3dav"> covering Economic Damages, Non-Economic Damages, Punitive Damages (Civil Code § 3294), Statutory Attorneys' Fees (Gov Code § 12965(b)), and statutory penalties.
       Include Closing Callout Box:
       <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>[Topic] is an unacceptable violation of California labor protections. Don’t face your employer alone. <a href="tel:8888070077">Contact Atoyan Law Firm’s [City] [Topic] team</a> today at (888) 807-0077 to demand the full compensation you are owed.</strong></em></p>

   - 2ND: HOW DO SECTION (Tab 4 - howDoHeading & howDoContent):
     Unique heading (e.g., "How Can a [City] [Topic] Lawyer at Atoyan Law Help?") and actionable guidance.
     Format with diagnostic questions including internal link:
     e.g., "Did the <a href="https://www.atoyanlaw.com/practice-areas/employment-law/work-retaliation/">employer retaliate after the employee complained?</a>"

   - 3RD: COMPENSATION SECTION (Tab 6 - compensationHeading & compensationIntro):
     Unique heading (e.g., "What Results and Compensation Can I Expect from a California [Topic] Claim?")
     Paragraph 1: Employee rights regarding this topic with internal link (<a href="https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/">report discrimination</a>).
     Paragraph 2: Impact statement and topic-tailored CTA with phone <a href="tel:8888070077">(888) 807-0077</a>.
     Conclude with firm contact link:
     "If you believe your workplace rights were violated in [City], Atoyan Employment Law can help you evaluate your claim. <a href="/contact/">Contact</a> the firm to discuss what happened and learn what options may be available to you."

4. DAVID ATOYAN APPROVED 10-QUESTION HIGH-INTENT GOOGLE SEARCH FAQ STRUCTURE (MANDATORY):
   You MUST generate EXACTLY 10 practical, multi-paragraph FAQs for [Topic] in [City], strictly adhering to this searcher progression:
   1. What Qualifies as [Topic] in [City], California?
   2. What Are Common Examples of [Topic] at Work?
   3. Can I Sue My Employer for [Topic] in [City]?
   4. Can My Employer Fire Me for Reporting [Topic]? (or for [Topic]?)
   5. Can My Employer Retaliate Against Me for Reporting [Topic]? (Must cite Labor Code § 1102.5, § 98.6, and SB 497's 90-day statutory presumption)
   6. What Evidence Do I Need for a Workplace [Topic] Case? (Must include 7-step actionable checklist and EDD unemployment benefits with link to edd.ca.gov)
   7. Can I Have a [Topic] Case If My Coworker Violated My Rights Instead of My Boss?
   8. Do I Have to Report [Topic] to HR Before I Can Sue?
   9. How Long Do I Have to File a [Topic] Claim in California? (MUST include the responsive comparison table comparing FEHA 3 years, EEOC 300 days, Tameny 2 years, Written Contract 4 years, Oral Contract 2 years, Whistleblower § 1102.5 3 years, Wage Theft 3-4 years, Workers' Comp § 132a 1 year, and links to calcivilrights.ca.gov and leginfo.legislature.ca.gov)
   10. How Much Is a [Topic] Case Worth in California? (MUST conclude with David Atoyan's localized attorney CTA block with clean slug and link to atoyanlaw.com)

   Every FAQ answer MUST contain 2-3 substantive paragraphs with Tailwind styling:
   <p class="my-2 [&+p]:mt-4 [&_strong:has(+br)]:inline-block [&_strong:has(+br)]:align-top">
   <ul class="marker:text-secondary list-disc pl-8">
   <ol class="marker:text-secondary list-decimal pl-8">

5. DYNAMIC EASY ACCORDION & FAQS:
   Set "accordionShortcode" to "" (empty string) in your JSON output.
   DO NOT reuse old or hardcoded accordion IDs. The system dynamically renders and embeds native Easy Accordion HTML.

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
  "servicesContent": "string (2,500-3,500+ words HTML with <h2 class=\"h2dav\">, <h3 class=\"h3dav\">, <p>, <strong>, <ul><li>, and topic-specific callout boxes across all 7 mandatory sections)",
  "howDoHeading": "string",
  "howDoContent": "string",
  "compensationHeading": "string",
  "compensationIntro": "string (Rights intro and topic CTA with (888) 807-0077)",
  "accordionShortcode": "string (leave empty \"\" for dynamic creation)",
  "faqs": [
    {
      "question": "string",
      "answer": "string (2-3 paragraphs; FAQ 9 must contain deadline table, FAQ 10 must end with Talk to a [City] [Topic] Lawyer CTA block)"
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
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const sim = generateAtoyanSimulated(keyword, resolvedCity);
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
  const validatedCity = typeof obj.city === "string" && obj.city ? obj.city : resolvedCity;
  const rawServices = typeof obj.servicesContent === "string" && obj.servicesContent ? obj.servicesContent : sim.servicesContent;

  // Guarantee internal SEO linking on services content
  const linkedServices = injectInternalLinks(rawServices, {
    currentSlug: resolvedSlug,
    city: validatedCity,
    maxLinks: 6,
  });

  // Guarantee How Do Section has strategic diagnostic question linking
  let finalHowDoContent = typeof obj.howDoContent === "string" && obj.howDoContent ? obj.howDoContent : sim.howDoContent;
  if (!finalHowDoContent.includes("<a href=") || !finalHowDoContent.includes("retaliat")) {
    finalHowDoContent = formatHowDoContentWithLinks({
      topic: cleanTopic,
      city: validatedCity,
      currentSlug: resolvedSlug,
    });
  }

  // Guarantee Compensation Section has clean editorial intro and contact link (no raw HTML accordions)
  let rawCompIntro = typeof obj.compensationIntro === "string" && obj.compensationIntro ? obj.compensationIntro : sim.compensationIntro;
  let finalCompIntro = rawCompIntro
    .replace(/<div\s+id=["']sp-ea-[\s\S]*$/i, "")
    .replace(/<div\s+class=["'][^"']*sp-easy-accordion[\s\S]*$/i, "")
    .replace(/\[sp_easyaccordion\s+id=["']?\d+["']?\]/gi, "")
    .trim();

  if (!finalCompIntro.includes('href="/contact/"') && !finalCompIntro.includes('href="https://www.atoyanlaw.com/contact/"')) {
    finalCompIntro = finalCompIntro + " If you believe your rights were violated in " + resolvedCity + ', Atoyan Employment Law can evaluate your claim. <a href="/contact/">Contact</a> the firm to discuss what happened.';
  }

  // Guarantee Question 9 contains David Atoyan's statutory deadline comparison table
  if (finalFaqs.length >= 9) {
    const q9 = finalFaqs[8];
    if (!q9.answer.includes("<table")) {
      q9.answer = q9.answer.trim() + "\n\n" + buildStatutoryDeadlineTableHtml(validatedCity);
    }
  }

  // Guarantee final FAQ item contains David Atoyan's localized attorney CTA block
  if (finalFaqs.length > 0) {
    const lastFaq = finalFaqs[finalFaqs.length - 1];
    if (!lastFaq.answer.includes("Talk to a") && !lastFaq.answer.includes("807-0077")) {
      const citySlug = validatedCity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const topicSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const ctaBlock = `\r\n<h2 id="talk-to-a-${citySlug}-${topicSlug}-lawyer" class="font-semibold leading-tight text-pretty mb-2 mt-4 text-base">Talk to a ${validatedCity} ${cleanTopic} Lawyer</h2>\r\n<p class="my-2">If you believe your workplace rights were violated, time limits apply under California law. <strong>Contact Atoyan Law at (888) 807-0077</strong> or through the online form at <a class="reset interactable cursor-pointer decoration-1 underline-offset-1 text-super-primary hover:underline" href="https://www.atoyanlaw.com/contact/" target="_blank" rel="noopener"><span class="text-box-trim-both">atoyanlaw.com</span></a> for a free, confidential case evaluation.</p>`;
      lastFaq.answer = lastFaq.answer.trim() + ctaBlock;
    }
  }

  const result: AtoyanLegalContent = {
    keyword: typeof obj.keyword === "string" && obj.keyword ? obj.keyword : keyword,
    city: validatedCity,
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
      typeof obj.yoastTitle === "string" && obj.yoastTitle ? obj.yoastTitle : decomposed.yoastTitle,
    yoastMetaDesc:
      typeof obj.yoastMetaDesc === "string" && obj.yoastMetaDesc
        ? obj.yoastMetaDesc
        : decomposed.yoastMetaDesc,
    yoastFocusKw:
      typeof obj.yoastFocusKw === "string" && obj.yoastFocusKw
        ? obj.yoastFocusKw
        : decomposed.yoastFocusKw,
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
 * Builds the exhaustive user prompt mandating the 7 California litigation sections and 8-10 FAQs.
 */
function buildLegalPrompt(keyword: string, city: string, linkCatalog: string, chatContext?: string): string {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const citySlug = resolvedCity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const topicSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const customContextDirective = chatContext && chatContext.trim()
    ? `\n\nCRITICAL ATTORNEY DIRECTIVE & CUSTOM PROMPT OVERRIDE:
The attorney has provided specific prompt instructions, tone guidelines, and questions:
"""
${chatContext.trim()}
"""
You MUST strictly follow the attorney's tone and structure above:
1. Use direct, bold question-based headings formatted as <h2 class="h2dav">Question?</h2> incorporating the exact questions and topics requested in the attorney's prompt.
2. Maintain short, simple sentences in active voice with NO em dashes (replace with commas or hyphens).
3. Weave in the requested local statistics, agency figures, and California statutory citations naturally.
4. Distribute the comprehensive ~2,200-word analysis across the 3 WordPress ACF content sections:
   - servicesContent: Main substantive discussion (questions 1 through 10-12 as <h2 class="h2dav">).
   - howDoHeading: "Why should you speak with a ${resolvedCity} ${cleanTopic} lawyer?"
   - howDoContent: Practical guidance and bullet points on when workers should reach out to Atoyan Law.
   - compensationHeading: "Contact Atoyan Law for a Free Consultation"
   - compensationIntro: Concluding rights summary and consultation call to action.
   - faqs: 8-10 direct search-intent FAQs.
`
    : "";

  return `${linkCatalog}${customContextDirective}

CRITICAL REQUIREMENT: servicesContent MUST be 2,200-3,500+ words of exhaustive, high-authority California employment law analysis for "${cleanTopic}" in ${resolvedCity}.
Tone MUST replicate David Atoyan's conversational, worker-first style with direct question-based headings (<h2 class="h2dav">), short active-voice sentences, no em dashes, concrete arithmetic examples ($25/hr -> $37.50 overtime, $3,600/yr off-the-clock, $11,000/yr break premiums, $6,000 waiting time penalties), and California Labor Code § 1171.5 undocumented worker protections.
DO NOT generate a short generic summary. Use question-based headings formatted with <h2 class="h2dav"> matching the topics below:

SECTION 1: STATUTORY FRAMEWORK & DEFINITIONS UNDER CALIFORNIA LAW
- Heading: <h2 class="h2dav">Understanding ${cleanTopic} Under California Law: Definitions, Rights, and Statutory Protections</h2>
- Cite Fair Employment and Housing Act (FEHA) Gov Code § 12940, protected categories, CROWN Act SB 188 if applicable, strict liability for supervisors vs negligence for coworkers under Gov Code § 12940(j), relevant California Labor Code sections.
- Include Early Callout Box:
<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>If your employer has subjected you to ${cleanTopic.toLowerCase()} in ${resolvedCity}, Atoyan Law Firm is here to fight for your rights. <a href="tel:8888070077">Contact our ${resolvedCity} ${cleanTopic} Attorneys</a> at (888) 807-0077 today for a free, confidential case evaluation.</strong></em></p>

SECTION 2: WORKPLACE MANIFESTATIONS & UNLAWFUL ADVERSE ACTIONS IN ${resolvedCity.toUpperCase()}
- Heading: <h2 class="h2dav">Common Forms of ${cleanTopic} in ${resolvedCity} Workplaces</h2>
- Subheadings with <h3 class="h3dav"> for Direct vs Disparate Impact, Adverse Employment Actions (demotion, pay reduction, constructive discharge), Hostile Work Environment legal standards.
- Detailed <ul> bulleted list with 6-8 concrete workplace examples typical in ${resolvedCity}.

SECTION 3: EMPLOYER PRETEXT, SHAM INVESTIGATIONS & PAPER TRAILS
- Heading: <h2 class="h2dav">How California Employers Mask ${cleanTopic}: Pretext, Bogus Write-Ups, and Sham HR Investigations</h2>
- Explain the McDonnell Douglas burden-shifting framework (Guz v. Bechtel National), retaliatory write-ups, bogus PIPs (performance improvement plans), sudden restructuring/RIFs, and HR bias protecting the employer.
- Include Mid Callout Box:
<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Facing sudden write-ups, bogus disciplinary reviews, or employer retaliation in ${resolvedCity}? You have legal rights under California law. Our ${resolvedCity} ${cleanTopic} Lawyers are prepared to hold them accountable. <a href="tel:8888070077">Call (888) 807-0077</a> for an immediate consultation.</strong></em></p>

SECTION 4: WORKPLACE RETALIATION & CALIFORNIA'S 90-DAY STATUTORY PRESUMPTION (SB 497)
- Heading: <h2 class="h2dav">Workplace Retaliation Under California Law: Labor Code § 1102.5 & Senate Bill 497</h2>
- Explain Labor Code § 1102.5 whistleblower rights, Labor Code § 98.6, and California Senate Bill 497 (SB 497) establishing a rebuttable presumption of retaliation if adverse action happens within 90 days of protected activity. Contrast California's employee-protective standard (Lawson v. PPG Architectural Finishes) with federal standards.

SECTION 5: EVIDENTIARY BLUEPRINT: HOW TO DOCUMENT & PROVE YOUR CASE
- Heading: <h2 class="h2dav">How to Document and Prove a ${cleanTopic} Claim in California</h2>
- Subheadings with <h3 class="h3dav"> on Documentary Evidence, Digital Communications (emails, texts, Slack/Teams), Comparator Evidence, and Contemporaneous Journaling.
- Detail what records to preserve and caution regarding California Penal Code § 632 two-party consent wiretapping laws.

SECTION 6: ADMINISTRATIVE PREREQUISITES & CRITICAL STATUTES OF LIMITATIONS
- Heading: <h2 class="h2dav">California Civil Rights Department (CRD), EEOC Filings, and Deadlines</h2>
- Detail California Government Code § 12960 administrative exhaustion with the California Civil Rights Department (CRD, formerly DFEH), immediate Right-to-Sue notice, dual filing with EEOC, the 3-year CRD filing deadline (Gov Code § 12960(e)), and the 1-year window to file in Superior Court after the Right-to-Sue notice.

SECTION 7: RECOVERABLE DAMAGES AND FINANCIAL COMPENSATION
- Heading: <h2 class="h2dav">What Compensation and Financial Damages Can You Recover in California?</h2>
- Subheadings with <h3 class="h3dav"> for Economic Damages (Back Pay, Front Pay, Lost Benefits, Stock Options), Non-Economic Damages (Emotional Distress, Mental Anguish), Punitive Damages under California Civil Code § 3294 (oppression, fraud, malice), and Statutory Attorneys' Fees under Gov Code § 12965(b).
- Include Concluding Callout Box:
<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>${cleanTopic} is an unacceptable violation of California labor protections. Don’t face your employer alone. <a href="tel:8888070077">Contact Atoyan Law Firm’s ${resolvedCity} ${cleanTopic} team</a> today at (888) 807-0077 to demand the full compensation you are owed.</strong></em></p>

MANDATORY 10-QUESTION HIGH-INTENT GOOGLE SEARCH FAQ STRUCTURE (DAVID ATOYAN APPROVED):
You MUST generate EXACTLY 10 practical, multi-paragraph FAQs for "${cleanTopic}" in ${resolvedCity}, covering this exact searcher progression:
1. What Qualifies as ${cleanTopic} in ${resolvedCity}, California?
2. What Are Common Examples of ${cleanTopic} at Work?
3. Can I Sue My Employer for ${cleanTopic} in ${resolvedCity}?
4. Can My Employer Fire Me for Reporting ${cleanTopic}? (or for ${cleanTopic}?)
5. Can My Employer Retaliate Against Me for Reporting ${cleanTopic}? (Must cite Labor Code § 1102.5, § 98.6, and SB 497's 90-day statutory presumption)
6. What Evidence Do I Need for a Workplace ${cleanTopic} Case? (Must include 7-step actionable checklist and EDD unemployment benefits with link to edd.ca.gov)
7. Can I Have a ${cleanTopic} Case If My Coworker Violated My Rights Instead of My Boss?
8. Do I Have to Report ${cleanTopic} to HR Before I Can Sue?
9. How Long Do I Have to File a ${cleanTopic} Claim in California? (MUST include the responsive comparison table comparing FEHA 3 years, EEOC 300 days, Tameny 2 years, Written Contract 4 years, Oral Contract 2 years, Whistleblower § 1102.5 3 years, Wage Theft 3-4 years, Workers' Comp § 132a 1 year, and links to calcivilrights.ca.gov and leginfo.legislature.ca.gov)
10. How Much Is a ${cleanTopic} Case Worth in California? (MUST conclude with David Atoyan's localized attorney CTA block with clean slug and link to atoyanlaw.com)

Every answer MUST contain 2-3 substantive paragraphs citing California Civil Rights Department (CRD), California Labor Code, and EEOC regulations.
The 10th FAQ answer MUST conclude with David Atoyan's localized attorney CTA block:
<h2 id="talk-to-a-${citySlug}-${topicSlug}-lawyer" class="font-semibold leading-tight text-pretty mb-2 mt-4 text-base">Talk to a ${resolvedCity} ${cleanTopic} Lawyer</h2>
<p class="my-2">If you believe your workplace rights were violated, time limits apply under California law. <strong>Contact Atoyan Law at (888) 807-0077</strong> or through the online form at <a class="reset interactable cursor-pointer decoration-1 underline-offset-1 text-super-primary hover:underline" href="https://www.atoyanlaw.com/contact/" target="_blank" rel="noopener"><span class="text-box-trim-both">atoyanlaw.com</span></a> for a free, confidential case evaluation.</p>

Output strictly valid JSON matching the schema.`;
}

async function generateAtoyanOpenAI(
  keyword: string,
  city: string,
  apiKey: string,
  systemPrompt?: string,
  chatContext?: string,
): Promise<AtoyanLegalContent> {
  const safeSlug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const linkCatalog = buildLinkingCatalogForLlm({ category: keyword, city, currentSlug: safeSlug });
  const prompt = buildLegalPrompt(keyword, city, linkCatalog, chatContext);
  const activePrompt = buildActiveSystemPrompt(systemPrompt, chatContext);

  for (const model of OPENAI_MODELS) {
    try {
      console.log(`[Atoyan LLM] Calling OpenAI (${model}) for "${keyword}" in ${city}...`);
      const isReasoningModel = model.startsWith("o1") || model.startsWith("o3");
      const requestBody: Record<string, unknown> = {
        model,
        messages: [
          { role: "system", content: activePrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      };

      if (isReasoningModel) {
        requestBody.max_completion_tokens = 16000;
      } else {
        requestBody.max_tokens = 16000;
        requestBody.temperature = 0.65;
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
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
  const prompt = buildLegalPrompt(keyword, city, linkCatalog, chatContext);
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
  const openaiKey = cleanApiKey(params.openaiKey || process.env.OPENAI_API_KEY);
  const geminiKey = cleanApiKey(params.geminiKey || process.env.GEMINI_API_KEY);

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
  const openaiKey = cleanApiKey(settings?.openai_api_key || process.env.OPENAI_API_KEY);
  const geminiKey = cleanApiKey(settings?.gemini_api_key || process.env.GEMINI_API_KEY);

  if (settings?.llm_provider === "openai" && openaiKey) return "openai";
  if (settings?.llm_provider === "gemini" && geminiKey) return "gemini";
  if (openaiKey) return "openai";
  if (geminiKey) return "gemini";
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
      model: provider === "openai" ? "chatgpt-4o-latest" : provider === "gemini" ? "gemini-2.5-flash" : "deterministic",
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
