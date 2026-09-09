import { NextResponse } from "next/server";
import { GenerateRequest } from "@/lib/types";
import { generateAtoyanContent, extractCity, activeProvider } from "@/lib/llm";
import { generateAtoyanImages } from "@/lib/imagen";
import { formatArticle } from "@/lib/formatting";
import { generateEasyAccordionHtml, generateFaqSchemaJsonLd } from "@/lib/atoyan";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = GenerateRequest.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues.map((i) => i.message) },
      { status: 422 },
    );
  }

  const { title: keyword, settings, schedule_at, accordion_shortcode } = parsed.data;
  const city = extractCity(keyword);
  const provider = await activeProvider(settings);

  try {
    // 1. Generate high-authority California legal content (OpenAI -> Gemini -> Simulator)
    const content = await generateAtoyanContent({
      keyword,
      city,
      openaiKey: settings?.openai_api_key,
      geminiKey: settings?.gemini_api_key,
      provider: (settings?.llm_provider || provider) as "openai" | "gemini" | "simulator",
      systemPrompt: settings?.system_prompt,
    });

    if (accordion_shortcode && accordion_shortcode.trim()) {
      content.accordionShortcode = accordion_shortcode.trim();
    }

    // 2. Generate Gemini Imagen visual pair (16:9 Banner + 4:3 Editorial Illustration)
    const images = await generateAtoyanImages({
      keyword,
      city,
      slug: content.slug,
      apiKey: settings?.gemini_api_key,
      openaiKey: settings?.openai_api_key,
    });

    // 3. Generate Accordion & Schema.org JSON-LD
    const accordionHtml = content.accordionShortcode || generateEasyAccordionHtml(content.faqs);
    const faqSchemaJsonLd = generateFaqSchemaJsonLd(content.faqs);

    // 4. Also provide formatted body for backward compatibility
    const legacyFormatted = settings
      ? formatArticle(`${content.servicesContent}\n\n${content.howDoContent}`, settings)
      : { formatted: content.servicesContent, headings_wrapped: 2, links_inserted: 0, cta_inserted: true, dashes_stripped: 0, html_stripped: false };

    return NextResponse.json({
      success: true,
      keyword,
      city,
      provider,
      content,
      images: {
        banner: {
          filename: images.banner.filename,
          altText: images.banner.altText,
          dataUrl: `data:${images.banner.mimeType};base64,${images.banner.base64}`,
          base64: images.banner.base64,
          mimeType: images.banner.mimeType,
          width: images.banner.width,
          height: images.banner.height,
        },
        services: {
          filename: images.services.filename,
          altText: images.services.altText,
          dataUrl: `data:${images.services.mimeType};base64,${images.services.base64}`,
          base64: images.services.base64,
          mimeType: images.services.mimeType,
          width: images.services.width,
          height: images.services.height,
        },
      },
      faqSchemaJsonLd,
      accordionHtml,
      schedule_at,
      title: content.heroTitle,
      raw: content.servicesContent,
      ...legacyFormatted,
    });
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json(
      {
        error: "generation_failed",
        message: err instanceof Error ? err.message : "Failed to generate content",
      },
      { status: 500 },
    );
  }
}
