"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Settings as SettingsIcon,
  Link2,
  Hash,
  Megaphone,
  Image as ImageIcon,
  Send,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSettings } from "@/lib/useSettings";
import { cn } from "@/lib/utils";

interface GenerateResponse {
  title: string;
  provider: string;
  model: string;
  raw: string;
  formatted: string;
  headings_wrapped: number;
  links_inserted: number;
  cta_inserted: boolean;
  dashes_stripped: number;
  html_stripped: boolean;
}

interface PublishResponse {
  mode: "live" | "simulated";
  post_url?: string;
  status: string;
  scheduled_for?: string;
  acf_payload: Record<string, unknown>;
}

export default function Home() {
  const { settings, ready } = useSettings();
  const [title, setTitle] = useState("How to Winterize Your Home in a Weekend");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setPublishResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "generation failed");
      setResult(data);
      setImageUrl(`/api/image?title=${encodeURIComponent(title)}&template=${settings.image_template}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "generation failed");
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    if (!result) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          formatted_body: result.formatted,
          cta_block: settings.cta_shortcode,
          image_url: imageUrl ? `${window.location.origin}${imageUrl}` : "",
          schedule_at: scheduleAt || undefined,
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "publish failed");
      setPublishResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "publish failed");
    } finally {
      setPublishing(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-5 text-accent" />
          WP Content Autopilot
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition"
          >
            <SettingsIcon className="size-4" /> Settings
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Title in. Published post out.</h1>
        <p className="text-muted max-w-2xl">
          Every step below is one you already do by hand — write, strip dashes, wrap headings, insert the CTA,
          auto-link keywords, build the topic image, paste into ACF fields, publish. This runs all seven,
          driven entirely by the rules in{" "}
          <Link href="/settings" className="text-accent hover:underline">
            Settings
          </Link>
          .
        </p>
      </header>

      <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
        <div className="flex gap-3">
          <input
            className="flex-1 rounded-lg border border-line bg-panel-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="Article title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            onClick={generate}
            disabled={loading || title.trim().length < 3}
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate
          </button>
        </div>
        {error && <p className="text-sm text-bad">{error}</p>}
        <p className="text-xs text-muted">
          Provider: <span className="font-mono">{settings.llm_provider}</span> — no key configured uses the
          deterministic simulator so this always works.
        </p>
      </div>

      {result && (
        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Formatted article</h2>
                <span className="text-xs text-muted font-mono">
                  {result.provider} / {result.model}
                </span>
              </div>
              <div
                className="prose-sm max-w-none text-sm leading-relaxed space-y-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_a]:text-accent [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: result.formatted }}
              />
            </div>

            <div className="rounded-2xl border border-line bg-panel p-6 space-y-3">
              <h2 className="font-medium flex items-center gap-2">
                <ImageIcon className="size-4 text-accent" /> Composited topic image
              </h2>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={title} className="w-full rounded-lg border border-line" />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-panel-2 p-5 space-y-3">
              <h3 className="text-sm font-medium">Pipeline audit</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <Hash className="size-3.5 text-accent" /> {result.headings_wrapped} headings wrapped in{" "}
                  <code className="text-xs">.{settings.heading_class}</code>
                </li>
                <li className="flex items-center gap-2">
                  <Link2 className="size-3.5 text-accent" /> {result.links_inserted} keyword links inserted
                </li>
                <li className="flex items-center gap-2">
                  <Megaphone className="size-3.5 text-accent" /> CTA {result.cta_inserted ? "inserted" : "missing"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-accent" /> {result.dashes_stripped} long dashes stripped
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-line bg-panel-2 p-5 space-y-3">
              <h3 className="text-sm font-medium">Publish to WordPress</h3>
              <label className="block space-y-1">
                <span className="text-xs text-muted flex items-center gap-1">
                  <Clock className="size-3" /> Schedule for (optional)
                </span>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                />
              </label>
              <button
                onClick={publish}
                disabled={publishing}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition",
                  "bg-accent text-white hover:opacity-90 disabled:opacity-50",
                )}
              >
                {publishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {scheduleAt ? "Schedule post" : "Publish now"}
              </button>

              {publishResult && (
                <div className="text-xs space-y-1 pt-2 border-t border-line">
                  <p className="text-muted">
                    Mode:{" "}
                    <span className={publishResult.mode === "live" ? "text-good" : "text-warn"}>
                      {publishResult.mode === "live" ? "live WordPress post" : "simulated (no WP creds set)"}
                    </span>
                  </p>
                  {publishResult.post_url && (
                    <a href={publishResult.post_url} className="text-accent hover:underline block truncate">
                      {publishResult.post_url}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
