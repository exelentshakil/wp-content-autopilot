import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    layers: {
      llm: "configured per-request via Settings (client-supplied key) — falls back to deterministic simulator",
      image: "next/og edge renderer, always live, no key required",
      wordpress: "configured per-request via Settings — falls back to simulated publish",
      traffic_db: process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "connected" : "not configured",
    },
  });
}
