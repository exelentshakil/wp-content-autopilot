import { NextResponse } from "next/server";
import { PublishRequest } from "@/lib/types";
import { publishToWordPress } from "@/lib/wordpress";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = PublishRequest.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues.map((i) => i.message) },
      { status: 422 },
    );
  }

  const { title, formatted_body, cta_block, image_url, schedule_at, settings } = parsed.data;

  try {
    const result = await publishToWordPress({
      title,
      body: formatted_body,
      cta: cta_block,
      image1Url: image_url,
      scheduleAt: schedule_at,
      settings,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "publish failed";
    return NextResponse.json({ error: "publish_failed", message }, { status: 500 });
  }
}
