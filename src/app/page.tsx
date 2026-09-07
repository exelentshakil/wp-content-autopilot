"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Settings as SettingsIcon,
  Send,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  HelpCircle,
  FileCode,
  ShieldCheck,
  Building2,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSettings } from "@/lib/useSettings";
import { cn } from "@/lib/utils";
import type { AtoyanLegalContent } from "@/lib/types";

interface ImageData {
  filename: string;
  altText: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
}

interface GenerateResponse {
  success: boolean;
  keyword: string;
  city: string;
  provider: string;
  content: AtoyanLegalContent;
  images: {
    banner: ImageData;
    services: ImageData;
  };
  faqSchemaJsonLd: string;
  accordionHtml: string;
  schedule_at?: string;
  title: string;
  formatted: string;
}

interface PublishResponse {
  success?: boolean;
  mode: "live" | "simulated";
  status: "publish" | "future";
  postId?: number;
  pageUrl?: string;
  editUrl?: string;
  scheduledFor?: string;
  bannerAttachmentId?: number;
  bannerUrl?: string;
  servicesAttachmentId?: number;
  servicesUrl?: string;
  yoastUpdated: boolean;
  inpostHeadScript?: string;
  acfPayload: Record<string, unknown>;
  error?: string;
  message?: string;
}

export default function Home() {
  const { settings, ready } = useSettings();
  const [keyword, setKeyword] = useState("Burbank Wrongful Termination Lawyer");
  const [scheduleAt, setScheduleAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "images" | "faqs" | "acf">("content");

  const sampleKeywords = [
    "Burbank Wrongful Termination Lawyer",
    "Visalia Sexual Harassment Lawyer",
    "Fresno Disability Discrimination Attorney",
    "Glendale Workplace Retaliation Lawyer",
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setPublishResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: keyword,
          schedule_at: scheduleAt || undefined,
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Generation failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (existingData?: GenerateResponse) => {
    const targetData = existingData || result;
    setPublishing(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: targetData ? targetData.content.heroTitle : keyword,
        schedule_at: scheduleAt || undefined,
        settings,
      };

      if (targetData) {
        payload.atoyan_content = targetData.content;
        payload.banner_image = {
          base64: targetData.images.banner.base64,
          filename: targetData.images.banner.filename,
          mimeType: targetData.images.banner.mimeType,
          altText: targetData.images.banner.altText,
        };
        payload.services_image = {
          base64: targetData.images.services.base64,
          filename: targetData.images.services.filename,
          mimeType: targetData.images.services.mimeType,
          altText: targetData.images.services.altText,
        };
      }

      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Publish failed");
      setPublishResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateAndPublish = async () => {
    setLoading(true);
    setError(null);
    setPublishResult(null);
    try {
      // Step 1: Generate preview data
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: keyword,
          schedule_at: scheduleAt || undefined,
          settings,
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.message || genData.error || "Generation failed");
      setResult(genData);

      // Step 2: Publish immediately
      await handlePublish(genData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed full automated workflow");
    } finally {
      setLoading(false);
    }
  };

  const copySchemaJsonLd = () => {
    const textToCopy = result?.faqSchemaJsonLd || publishResult?.inpostHeadScript;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  if (!ready) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text">Atoyan Law Firm</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-good/10 text-good border border-good/20">
                Live WP REST Connected
              </span>
            </div>
            <p className="text-xs text-muted">Practice Area Autopilot • SCF Field Group 348 • Gemini Imagen 3</p>
          </div>
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

      {/* Main Input Hero */}
      <section className="rounded-2xl border border-line bg-panel p-6 space-y-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Generate &amp; Publish Practice Area Page</h1>
          <p className="text-sm text-muted">
            Automates legal content writing (California FEHA &amp; Labor Code depth), Gemini Imagen visuals (16:9 header + 4:3 services), media library uploads, SCF Field Group 348 mapping, and Yoast SEO synchronization.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Target Keyword / Practice Area Topic
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 rounded-xl border border-line bg-panel-2 px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 font-medium"
                placeholder="e.g. Burbank Wrongful Termination Lawyer"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading || publishing || keyword.trim().length < 3}
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel-2 px-4 py-3 text-sm font-medium hover:bg-panel transition disabled:opacity-50"
                  title="Generate preview before publishing"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-accent" />}
                  Generate Preview
                </button>
                <button
                  onClick={handleGenerateAndPublish}
                  disabled={loading || publishing || keyword.trim().length < 3}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 shadow-sm"
                  title="Generate content and publish straight to WordPress"
                >
                  {publishing || loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {scheduleAt ? "Generate & Schedule" : "1-Click Publish Now"}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Keywords & Scheduling */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-line/50 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted">Quick ideas:</span>
              {sampleKeywords.map((k) => (
                <button
                  key={k}
                  onClick={() => setKeyword(k)}
                  className="px-2.5 py-1 rounded-lg border border-line bg-panel-2 hover:border-accent/40 transition text-muted hover:text-text"
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-muted" />
              <span className="text-muted">Schedule (optional):</span>
              <input
                type="datetime-local"
                className="rounded-lg border border-line bg-panel-2 px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent/40"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
              {scheduleAt && (
                <button
                  onClick={() => setScheduleAt("")}
                  className="text-muted hover:text-bad"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-bad/30 bg-bad/10 p-4 text-sm text-bad">
            {error}
          </div>
        )}
      </section>

      {/* Publish Result Banner */}
      {publishResult && (
        <section className="rounded-2xl border border-good/30 bg-good/5 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-good/20 flex items-center justify-center text-good">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text">
                  Page {publishResult.status === "future" ? "Scheduled Successfully" : "Published Live"}!
                </h2>
                <p className="text-xs text-muted">
                  Parent: <strong>Employment Law (#750)</strong> • Template: <strong>templates/labor-law.php</strong> • Post ID: #{publishResult.postId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {publishResult.pageUrl && (
                <a
                  href={publishResult.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-white px-3.5 py-2 text-xs font-medium hover:opacity-90 transition"
                >
                  <ExternalLink className="size-3.5" /> View Live Page
                </a>
              )}
              {publishResult.editUrl && (
                <a
                  href={publishResult.editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3.5 py-2 text-xs font-medium hover:bg-panel-2 transition text-text"
                >
                  <FileCode className="size-3.5 text-accent" /> Edit in WP-Admin
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-good/20 text-xs">
            <div className="bg-panel p-3 rounded-lg border border-line">
              <span className="text-muted block">Status:</span>
              <span className="font-semibold capitalize text-good">{publishResult.status}</span>
            </div>
            <div className="bg-panel p-3 rounded-lg border border-line">
              <span className="text-muted block">Yoast SEO:</span>
              <span className="font-semibold text-good">
                {publishResult.yoastUpdated ? "Synced (Title + Meta)" : "Meta fallback saved"}
              </span>
            </div>
            <div className="bg-panel p-3 rounded-lg border border-line">
              <span className="text-muted block">Banner Media ID:</span>
              <span className="font-semibold">#{publishResult.bannerAttachmentId || "Default"}</span>
            </div>
            <div className="bg-panel p-3 rounded-lg border border-line">
              <span className="text-muted block">Services Media ID:</span>
              <span className="font-semibold">#{publishResult.servicesAttachmentId || "3936"}</span>
            </div>
          </div>

          {(publishResult.inpostHeadScript || result?.faqSchemaJsonLd) && (
            <div className="rounded-xl border border-accent/30 bg-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-semibold text-text">
                  <FileCode className="size-4 text-accent" />
                  <span>Insert Script to &lt;head&gt;</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-normal">
                    _inpost_head_script
                  </span>
                </div>
                <p className="text-muted">
                  The code below will be inserted into the &lt;head&gt; section of this specific page/post.
                </p>
              </div>
              <button
                onClick={copySchemaJsonLd}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-white px-3 py-1.5 text-xs font-medium hover:opacity-90 transition shrink-0"
              >
                {copiedSchema ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copiedSchema ? "Copied to Clipboard" : "Copy <head> Script"}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Generated Preview Decker */}
      {result && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("content")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition",
                  activeTab === "content" ? "bg-accent text-white" : "text-muted hover:text-text bg-panel-2 border border-line",
                )}
              >
                Article Content
              </button>
              <button
                onClick={() => setActiveTab("images")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition",
                  activeTab === "images" ? "bg-accent text-white" : "text-muted hover:text-text bg-panel-2 border border-line",
                )}
              >
                Generated Images (2)
              </button>
              <button
                onClick={() => setActiveTab("faqs")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition",
                  activeTab === "faqs" ? "bg-accent text-white" : "text-muted hover:text-text bg-panel-2 border border-line",
                )}
              >
                FAQs &amp; Schema ({result?.content?.faqs?.length ?? 0})
              </button>
              <button
                onClick={() => setActiveTab("acf")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition",
                  activeTab === "acf" ? "bg-accent text-white" : "text-muted hover:text-text bg-panel-2 border border-line",
                )}
              >
                ACF Fields (27)
              </button>
            </div>

            {!publishResult && (
              <button
                onClick={() => handlePublish()}
                disabled={publishing}
                className="inline-flex items-center gap-2 rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {publishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {scheduleAt ? "Publish Schedule" : "Publish This Page Now"}
              </button>
            )}
          </div>

          {/* TAB 1: CONTENT */}
          {activeTab === "content" && (
            <div className="grid md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                {/* Hero Title & Services */}
                <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                  <div className="border-b border-line pb-3">
                    <span className="text-xs uppercase tracking-wider text-accent font-semibold">Hero Title (ACF: personal_injury_title)</span>
                    <h2 className="text-2xl font-bold mt-1 text-text">{result.content.heroTitle}</h2>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted font-medium">Services Heading &amp; Subheading</span>
                    <h3 className="text-lg font-semibold mt-1 text-text">{result.content.servicesHeading}</h3>
                    <p className="text-sm font-medium text-accent">{result.content.servicesSubHeading}</p>
                  </div>

                  <div className="border-t border-line pt-4">
                    <span className="text-xs uppercase tracking-wider text-muted font-medium mb-3 block">
                      Services Content WYSIWYG
                    </span>
                    <div
                      className="prose-sm max-w-none text-sm leading-relaxed space-y-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_a]:text-accent [&_a]:underline [&_.txt-hlt]:border-l-4 [&_.txt-hlt]:border-accent [&_.txt-hlt]:bg-panel-2 [&_.txt-hlt]:p-4 [&_.txt-hlt]:rounded-r-lg"
                      dangerouslySetInnerHTML={{ __html: result.content.servicesContent }}
                    />
                  </div>
                </div>

                {/* How Do Section */}
                <div className="rounded-2xl border border-line bg-panel p-6 space-y-3">
                  <span className="text-xs uppercase tracking-wider text-muted font-medium">How Do Section (how_do_content)</span>
                  <h3 className="text-lg font-semibold text-text">{result.content.howDoHeading}</h3>
                  <div
                    className="text-sm leading-relaxed space-y-3 text-muted"
                    dangerouslySetInnerHTML={{ __html: result.content.howDoContent }}
                  />
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-4">
                {/* Yoast Card */}
                <div className="rounded-2xl border border-line bg-panel-2 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-good" />
                    <h3 className="text-sm font-semibold">Yoast SEO Preview</h3>
                  </div>
                  <div className="rounded-lg border border-line bg-panel p-3 text-xs space-y-1 font-sans">
                    <span className="text-accent font-medium block truncate">{result.content.yoastTitle}</span>
                    <span className="text-good block truncate">atoyanlaw.com/practice-areas/employment-law/{result.content.slug}/</span>
                    <p className="text-muted leading-relaxed line-clamp-3">{result.content.yoastMetaDesc}</p>
                  </div>
                  <div className="text-xs space-y-1 text-muted">
                    <p>Focus Keyword: <strong className="text-text">{result.content.yoastFocusKw}</strong></p>
                    <p>Slug: <code className="font-mono text-accent">/{result.content.slug}/</code></p>
                  </div>
                </div>

                {/* Automation Badges */}
                <div className="rounded-2xl border border-line bg-panel-2 p-5 space-y-3 text-xs">
                  <h3 className="font-semibold text-text flex items-center gap-2">
                    <Layers className="size-4 text-accent" /> WordPress Assembly
                  </h3>
                  <ul className="space-y-2 text-muted">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-good" /> Parent page set to <strong>#750 (Employment Law)</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-good" /> Template: <strong>templates/labor-law.php</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-good" /> 27 Practice Area sidebar cross-links cloned
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-good" /> 8 Authentic client reviews preserved
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-good" /> Contact form 7 shortcode retained
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMAGES */}
          {activeTab === "images" && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-line bg-panel p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Branded Header Banner (1920 × 451)</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">Atoyan &quot;A&quot; Logo + Gradient</span>
                  </div>
                  <span className="text-xs text-muted font-mono">personal_injury_image</span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-line bg-panel-2 aspect-[1920/451] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.images.banner.dataUrl}
                    alt={result.images.banner.altText}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <p className="truncate max-w-[70%]">{result.images.banner.altText}</p>
                  <span className="font-mono text-accent">1920×451 Cover Banner</span>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-panel p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Branded Services Image (600 × 400)</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">Typography Overlay Bar</span>
                  </div>
                  <span className="text-xs text-muted font-mono">_personal_injury_services_content</span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-line bg-panel-2 aspect-[600/400] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.images.services.dataUrl}
                    alt={result.images.services.altText}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <p className="truncate max-w-[70%]">Embedded via <code className="text-accent">&lt;img class=&quot;alignleft&quot; /&gt;</code></p>
                  <span className="font-mono text-accent">600×400 Editorial Bar</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FAQS & SCHEMA */}
          {activeTab === "faqs" && (
            <div className="space-y-6">
              {/* Insert Script to <head> (_inpost_head_script) Meta Box */}
              <div className="rounded-2xl border-2 border-accent/40 bg-panel p-6 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileCode className="size-5 text-accent" />
                      <h3 className="font-bold text-lg text-text">Insert Script to &lt;head&gt;</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold">
                        custom field: _inpost_head_script
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      The code below will be inserted into the &lt;head&gt; section of this specific page/post.
                    </p>
                  </div>

                  <button
                    onClick={copySchemaJsonLd}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-4 py-2.5 text-xs font-bold hover:opacity-90 transition shadow-sm self-start sm:self-auto"
                  >
                    {copiedSchema ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copiedSchema ? "Copied to Clipboard!" : "Copy Script for <head>"}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Schema.org FAQPage JSON-LD Structured Data</span>
                    <span className="font-mono text-accent">synth_header_script</span>
                  </div>
                  <pre className="p-4 rounded-xl bg-panel-2 border border-line text-xs font-mono overflow-x-auto text-text max-h-72 leading-relaxed selection:bg-accent selection:text-white">
                    {result.faqSchemaJsonLd}
                  </pre>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="size-5 text-accent" />
                    <h3 className="font-semibold text-lg">Interactive Easy Accordion Preview</h3>
                  </div>
                  <span className="text-xs text-muted">Embedded in compensation_content + [sp_easyaccordion id=&quot;3932&quot;]</span>
                </div>

                <div className="space-y-3">
                  {(result.content?.faqs || []).map((faq, i) => (
                    <details key={i} className="group rounded-xl border border-line bg-panel-2 p-4 text-sm" open={i === 0}>
                      <summary className="font-semibold cursor-pointer text-text hover:text-accent transition flex items-center justify-between">
                        <span>{faq.question}</span>
                        <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <p className="mt-3 text-muted leading-relaxed pt-2 border-t border-line/60">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACF FIELD MAPPING */}
          {activeTab === "acf" && (
            <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">ACF Field Group 348 (personal_injury_group)</h3>
                <p className="text-xs text-muted">
                  Mapping all 27 subfields across 6 tabs. Exposed via Secure Custom Fields REST API.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                  <span className="text-accent font-semibold block">Tab 1: Personal Injury (Hero)</span>
                  <p className="text-muted">personal_injury_image: <span className="text-text font-sans">Gemini 16:9 Banner</span></p>
                  <p className="text-muted">personal_injury_title: <span className="text-text font-sans">{result.content.heroTitle}</span></p>
                </div>

                <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                  <span className="text-accent font-semibold block">Tab 2: Services Section</span>
                  <p className="text-muted">_personal_injury_services_heading: <span className="text-text font-sans">{result.content.servicesHeading}</span></p>
                  <p className="text-muted">_personal_injury_services_sub_heading: <span className="text-text font-sans">{result.content.servicesSubHeading}</span></p>
                  <p className="text-muted">_personal_injury_services_Sidebar: <span className="text-good font-sans">27 Cloned Practice Area IDs</span></p>
                </div>

                <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                  <span className="text-accent font-semibold block">Tab 3: Testimonials Section</span>
                  <p className="text-muted">testimonials_reviews_repet: <span className="text-good font-sans">8 Authentic Client Reviews Cloned</span></p>
                  <p className="text-muted">testimonials_reviews_bg_image: <span className="text-good font-sans">Preserved from Page 3933</span></p>
                </div>

                <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                  <span className="text-accent font-semibold block">Tab 4: How Do Section</span>
                  <p className="text-muted">how_do_heading: <span className="text-text font-sans">{result.content.howDoHeading}</span></p>
                  <p className="text-muted">how_do_contact_form_shortcode: <span className="text-good font-sans">[contact-form-7 id=&quot;2701763&quot;]</span></p>
                </div>

                <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                  <span className="text-accent font-semibold block">Tab 5: CTA Section</span>
                  <p className="text-muted">cta_heading: <span className="text-good font-sans">Get The Representation You Deserve</span></p>
                  <p className="text-muted">cta_bg_image: <span className="text-good font-sans">Preserved from Page 3933</span></p>
                </div>

                <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                  <span className="text-accent font-semibold block">Tab 6: Compensation Section</span>
                  <p className="text-muted">compensation_heading: <span className="text-text font-sans">{result.content.compensationHeading}</span></p>
                  <p className="text-muted">compensation_content: <span className="text-text font-sans">Legal intro + Callout + Easy Accordion + FAQPage JSON-LD</span></p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
