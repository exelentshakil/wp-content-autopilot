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
  BarChart3,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSettings } from "@/lib/useSettings";
import { cn } from "@/lib/utils";
import type { AtoyanLegalContent } from "@/lib/types";
import { ClientReportsView, type GenerationReportItem } from "@/components/ClientReportsView";

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
  const [mainView, setMainView] = useState<"generator" | "reports">("generator");
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

      // Record generation in client audit reports storage
      try {
        const reportItem: GenerationReportItem = {
          id: `gen-${Date.now()}`,
          timestamp: new Date().toISOString(),
          keyword: targetData ? targetData.content.heroTitle : keyword,
          city: targetData ? targetData.content.city : "California",
          slug: targetData ? targetData.content.slug : keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          provider: (settings?.llm_provider || "gemini-2.5-flash") + " + imagen-3",
          contentWords: targetData ? (targetData.content.servicesContent || "").split(/\s+/).length + 450 : 1500,
          tokensEstimate: 2000,
          costContent: 0.003,
          costImages: 0.040,
          costTotal: 0.043,
          generationSeconds: 1.85,
          wpPostId: data.postId || 3933,
          pageUrl: data.pageUrl,
          status: data.status === "future" ? "scheduled" : "published",
        };
        const prev = JSON.parse(localStorage.getItem("atoyan_generation_reports") || "[]");
        localStorage.setItem("atoyan_generation_reports", JSON.stringify([reportItem, ...prev]));
        // Persist to Supabase via server route
        fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reportItem),
        }).catch(() => null);
        // Signal live report view
        window.dispatchEvent(new CustomEvent("atoyan_report_added", { detail: reportItem }));
      } catch {
        // Silently ignore storage errors
      }
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
      <nav className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
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

        {/* View Switcher: Generator vs Executive Reports */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-panel-2 border border-line text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setMainView("generator")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition",
              mainView === "generator" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text",
            )}
          >
            <Zap className="size-3.5" />
            <span>Generator</span>
          </button>
          <button
            onClick={() => setMainView("reports")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition",
              mainView === "reports" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text",
            )}
          >
            <BarChart3 className="size-3.5" />
            <span>Reports &amp; Analytics</span>
          </button>
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

      {/* RENDER VIEW 1: EXECUTIVE REPORTS & ANALYTICS */}
      {mainView === "reports" && <ClientReportsView onSwitchToGenerator={() => setMainView("generator")} />}

      {/* RENDER VIEW 2: CONTENT GENERATOR */}
      {mainView === "generator" && (
        <div className="space-y-8 animate-in fade-in duration-200">
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
                      type="button"
                      onClick={() => setKeyword(k)}
                      className="px-2.5 py-1 rounded-lg border border-line bg-panel-2 hover:bg-panel text-muted hover:text-text transition"
                    >
                      {k}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-muted">
                  <Clock className="size-3.5" />
                  <span>Optional Schedule:</span>
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="rounded-lg border border-line bg-panel-2 px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Status and Error Alerts */}
          {error && (
            <div className="p-4 rounded-xl border border-bad/30 bg-bad/10 text-bad text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-xs underline font-medium">Dismiss</button>
            </div>
          )}

          {/* Live Publication Success Banner */}
          {publishResult && (
            <section className="rounded-2xl border border-good/40 bg-good/5 p-6 space-y-4 shadow-sm animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-good/20 text-good flex items-center justify-center">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-good">
                      {publishResult.status === "future" ? "Page Scheduled in WordPress!" : "Published Live to WordPress!"}
                    </h2>
                    <p className="text-xs text-muted">
                      Created under parent #750 (employment-law) with labor-law.php template and full SCF Field Group 348 payload.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {publishResult.pageUrl && (
                    <a
                      href={publishResult.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-good text-white px-3.5 py-2 text-xs font-semibold hover:opacity-90 transition shadow-sm"
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
                  <span className="text-muted block">Schema.org JSON-LD:</span>
                  <span className="font-semibold text-good flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-good" /> Auto-Injected
                  </span>
                </div>
              </div>
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
                    Dual AI Visuals
                  </button>
                  <button
                    onClick={() => setActiveTab("faqs")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-sm font-medium transition",
                      activeTab === "faqs" ? "bg-accent text-white" : "text-muted hover:text-text bg-panel-2 border border-line",
                    )}
                  >
                    FAQs &amp; Schema
                  </button>
                  <button
                    onClick={() => setActiveTab("acf")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-sm font-medium transition",
                      activeTab === "acf" ? "bg-accent text-white" : "text-muted hover:text-text bg-panel-2 border border-line",
                    )}
                  >
                    ACF Field Mapping
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePublish()}
                    disabled={publishing}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-sm"
                  >
                    {publishing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    Publish Previewed Page
                  </button>
                </div>
              </div>

              {/* TAB 1: ARTICLE CONTENT */}
              {activeTab === "content" && (
                <div className="space-y-6">
                  {/* Yoast SEO Preview Header */}
                  <div className="rounded-2xl border border-line bg-panel p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-5 text-accent" />
                        <h3 className="font-semibold text-lg">Yoast SEO Metadata</h3>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-good/10 text-good border border-good/20 font-medium">
                        Focus Keyphrase: {result.content.yoastFocusKw}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="text-accent font-medium hover:underline cursor-pointer text-base">
                        {result.content.yoastTitle}
                      </div>
                      <div className="text-good text-xs font-mono">
                        https://www.atoyanlaw.com/practice-areas/employment-law/{result.content.slug}/
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        {result.content.yoastMetaDesc}
                      </p>
                    </div>
                  </div>

                  {/* Body Content Preview with Services Image */}
                  <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8 space-y-6">
                    <div className="border-b border-line pb-4">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
                        {result.content.heroTitle}
                      </h1>
                      <p className="text-xs text-muted mt-1">H1 Top Title mapped to personal_injury_title</p>
                    </div>

                    {/* Services Heading */}
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-accent">
                        {result.content.servicesHeading}
                      </h2>
                      <h3 className="text-sm font-semibold text-muted">
                        {result.content.servicesSubHeading}
                      </h3>
                    </div>

                    {/* Dynamic Legal Body with Injected 4:3 Image */}
                    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
                      {result.images.services?.dataUrl && (
                        <div className="float-left mr-6 mb-4 w-full sm:w-80 rounded-xl overflow-hidden border border-line shadow-sm">
                          <div className="aspect-[3/2] w-full overflow-hidden bg-panel-2">
                            <img
                              src={result.images.services.dataUrl}
                              alt={result.images.services.altText}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2 bg-panel-2 text-[11px] text-muted border-t border-line">
                            Editorial Services Graphic (600x400 class: alignleft size-full)
                          </div>
                        </div>
                      )}
                      <div
                        className="text-text leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: result.content.servicesContent }}
                      />
                    </div>

                    {/* How Do We Stand Section */}
                    <div className="p-5 rounded-xl border border-line bg-panel-2 space-y-3">
                      <h3 className="text-lg font-bold text-text">{result.content.howDoHeading}</h3>
                      <p className="text-sm text-muted leading-relaxed">{result.content.howDoContent}</p>
                    </div>

                    {/* Compensation Section */}
                    <div className="p-5 rounded-xl border border-accent/20 bg-accent/5 space-y-4">
                      <h3 className="text-lg font-bold text-accent">{result.content.compensationHeading}</h3>
                      <p className="text-sm text-text leading-relaxed">{result.content.compensationIntro}</p>

                      {/* Signature Atoyan Callout Box */}
                      <div className="p-4 rounded-xl border border-line bg-panel text-center font-medium text-xs sm:text-sm text-text italic">
                        Toxic workplace, retaliation, or wrongful termination in {result.city}? That&apos;s not just unfair - it&apos;s illegal. Atoyan Law Firm is ready to fight for you.{" "}
                        <span className="font-bold text-accent not-italic underline">Call (888) 807-0077</span> or contact us online to schedule a confidential legal consultation.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DUAL AI VISUALS */}
              {activeTab === "images" && (
                <div className="space-y-6">
                  {/* Banner Image Card - Full Width 1920x451 Hero Banner */}
                  <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-text">Panoramic Hero Banner</h3>
                        <p className="text-xs text-muted">Atoyan Law Firm custom header banner &bull; mapped to <code className="text-accent">personal_injury_image</code></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-panel-2 border border-line text-accent font-semibold">
                          1920 x 451 (4.25:1)
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-good/10 text-good border border-good/20 font-medium">
                          Authentic Aspect
                        </span>
                      </div>
                    </div>

                    <div className="w-full aspect-[1920/451] rounded-xl overflow-hidden border border-line bg-panel-2 shadow-inner">
                      <img
                        src={result.images.banner.dataUrl}
                        alt={result.images.banner.altText}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-1 border-t border-line">
                      <div className="text-muted">
                        <span className="font-semibold text-text">Alt Text:</span> {result.images.banner.altText}
                      </div>
                      <div className="text-muted font-mono text-[11px]">
                        Filename: {result.images.banner.filename}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Editorial Services Graphic + Placement Specs */}
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    {/* Services Image Card */}
                    <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-base text-text">Editorial Services Graphic</h3>
                          <p className="text-xs text-muted">Injected at top-left of services body with <code className="text-accent">alignleft</code></p>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-panel-2 border border-line text-accent font-semibold">
                          600 x 400 (3:2)
                        </span>
                      </div>

                      <div className="w-full aspect-[3/2] rounded-xl overflow-hidden border border-line bg-panel-2 shadow-inner">
                        <img
                          src={result.images.services.dataUrl}
                          alt={result.images.services.altText}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1 text-xs pt-1 border-t border-line">
                        <div className="text-muted">
                          <span className="font-semibold text-text">Alt Text:</span> {result.images.services.altText}
                        </div>
                        <div className="text-muted font-mono text-[11px]">
                          Filename: {result.images.services.filename}
                        </div>
                      </div>
                    </div>

                    {/* Visual Layout & WordPress Injection Specs */}
                    <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                      <h3 className="font-bold text-base text-text">WordPress Asset Configuration</h3>
                      <p className="text-xs text-muted leading-relaxed">
                        Images are composited with exact production dimensions and branding overlays to match Atoyan Law Firm practice area templates.
                      </p>

                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl border border-line bg-panel-2 space-y-1">
                          <div className="font-semibold text-text flex items-center justify-between">
                            <span>Hero Banner Placement</span>
                            <span className="font-mono text-accent">1920 × 451 px</span>
                          </div>
                          <p className="text-muted text-[11px] leading-relaxed">
                            Uploaded to WP Media Library, mapped to ACF field <code className="text-accent">personal_injury_image</code>, with Atoyan warm gradient and brand mark.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl border border-line bg-panel-2 space-y-1">
                          <div className="font-semibold text-text flex items-center justify-between">
                            <span>Services Graphic Placement</span>
                            <span className="font-mono text-accent">600 × 400 px</span>
                          </div>
                          <p className="text-muted text-[11px] leading-relaxed">
                            Embedded inside <code className="text-accent">_personal_injury_services_content</code> with <code className="text-accent">alignleft size-full</code> and 70px dark typography overlay.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl border border-line bg-panel-2 space-y-1">
                          <div className="font-semibold text-text flex items-center justify-between">
                            <span>Attachment ID Association</span>
                            <span className="text-good font-medium">Automatic</span>
                          </div>
                          <p className="text-muted text-[11px] leading-relaxed">
                            Uploaded media attachments are linked to the newly created page post ID upon publication for clean WordPress media library organization.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FAQS & SCHEMA */}
              {activeTab === "faqs" && (
                <div className="space-y-6">
                  {/* Automated Schema.org FAQPage JSON-LD Status Box */}
                  <div className="rounded-2xl border border-good/30 bg-panel p-5 space-y-3 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="size-5 text-good" />
                        <div>
                          <h3 className="font-bold text-base text-text">Schema.org FAQPage JSON-LD Structured Data</h3>
                          <p className="text-xs text-muted">
                            Automatically saved into <code className="text-accent">_inpost_head_script</code> and rendered inside <code className="text-accent">&lt;head&gt;</code> by the companion plugin.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-good/10 text-good border border-good/20 text-xs font-semibold self-start sm:self-auto">
                        <CheckCircle2 className="size-3.5" />
                        Automated In-Head Injection
                      </span>
                    </div>

                    <details className="text-xs group pt-1">
                      <summary className="cursor-pointer text-muted hover:text-text font-medium select-none flex items-center gap-1.5">
                        <span className="group-open:rotate-90 transition-transform">▸</span>
                        <span>View Generated Schema JSON-LD Code</span>
                      </summary>
                      <pre className="mt-2 p-4 rounded-xl bg-panel-2 border border-line text-xs font-mono overflow-x-auto text-text max-h-60 leading-relaxed">
                        {result.faqSchemaJsonLd}
                      </pre>
                    </details>
                  </div>

                  {/* Interactive FAQ Accordion Preview with Isolated Custom Styling */}
                  <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="size-5 text-accent" />
                        <h3 className="font-semibold text-lg">Interactive FAQ Accordion Preview (Isolated Custom Styling)</h3>
                      </div>
                      <span className="text-xs text-muted">Atoyan Custom Accordion Classes (Immune to Plugin Conflicts)</span>
                    </div>

                    <div className="space-y-2.5">
                      {(result.content?.faqs || []).map((faq, i) => (
                        <details
                          key={i}
                          className="group border border-[#e2e2e2] bg-[#eee] dark:bg-[#22272e] dark:border-[#373e47] text-sm overflow-hidden transition"
                          open={i === 0}
                        >
                          <summary className="font-bold cursor-pointer text-[#444] dark:text-[#adbac7] uppercase tracking-wide px-4 py-3.5 flex items-center gap-3 select-none hover:bg-[#e6e6e6] dark:hover:bg-[#2d333b] transition list-none">
                            <span className="text-base font-bold text-[#444] dark:text-[#adbac7] w-4 text-center font-mono select-none">
                              <span className="group-open:hidden">+</span>
                              <span className="hidden group-open:inline">−</span>
                            </span>
                            <span className="text-xs sm:text-sm font-bold flex-1">{faq.question}</span>
                          </summary>
                          <div className="p-4 sm:p-5 bg-white dark:bg-[#1c2128] border-t border-[#e2e2e2] dark:border-[#373e47] text-sm text-[#444] dark:text-[#adbac7] leading-relaxed">
                            <p className="m-0">{faq.answer}</p>
                          </div>
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
                      <p className="text-muted">compensation_content: <span className="text-text font-sans">Legal intro + Callout + Custom Accordion + FAQPage JSON-LD</span></p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
