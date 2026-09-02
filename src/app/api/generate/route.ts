import { NextResponse } from "next/server";
import { GenerateRequest } from "@/lib/types";
import { generateArticle, activeProvider } from "@/lib/llm";
import { formatArticle } from "@/lib/formatting";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const { title, settings } = parsed.data;
  const provider = await activeProvider(settings);
  const article = await generateArticle(title, settings);
  const formatted = formatArticle(article.body, settings);

  return NextResponse.json({
    title,
    provider,
    model: article.model,
    ...formatted,
  });
}
