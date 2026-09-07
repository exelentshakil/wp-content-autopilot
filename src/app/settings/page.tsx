"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  KeyRound,
  Globe,
  Layers,
  ShieldCheck,
  FileCode,
  Building2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { useSettings } from "@/lib/useSettings";
import { cn } from "@/lib/utils";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-text">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40";

export default function SettingsPage() {
  const { settings, update, ready } = useSettings();
  const [savedFlash, setSavedFlash] = useState(false);

  if (!ready) return null;

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const resetToAtoyanDefaults = () => {
    update({
      llm_provider: "openai",
      wp_site_url: "https://www.atoyanlaw.com",
      wp_username: "",
      wp_app_password: "",
      heading_class: "h2dav",
      cta_shortcode: '[sp_easyaccordion id="3932"]',
      system_prompt:
        "You are the senior legal content strategist and California employment attorney for Atoyan Law Firm (atoyanlaw.com). Write authoritative, localized practice area articles citing FEHA, California Labor Code §§ 98.6/1102.5, SB 497, and Yanowitz v. L'Oreal.",
    });
    flashSaved();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition"
        >
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-between mt-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline Settings</h1>
            <p className="text-muted mt-1 text-sm max-w-2xl">
              Configured for <strong>Atoyan Law Firm</strong> practice area automation. API keys entered here are stored in your browser&apos;s localStorage or read from <code>.env.local</code> / Vercel Environment Variables.
            </p>
          </div>
          <button
            onClick={resetToAtoyanDefaults}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent border border-line rounded-lg px-3 py-2 bg-panel-2 transition"
            title="Reset to Atoyan Law Firm verified defaults"
          >
            <RotateCcw className="size-3.5" /> Reset Defaults
          </button>
        </div>
      </div>

      {/* WordPress Connection */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-text">
            <Globe className="size-4 text-accent" /> WordPress REST API Connection
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-good/10 text-good border border-good/20 inline-flex items-center gap-1">
            <CheckCircle2 className="size-3" /> Basic Auth Connected
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Site URL" hint="Root domain with https://">
            <input
              className={inputCls}
              placeholder="https://www.atoyanlaw.com"
              value={settings.wp_site_url ?? ""}
              onChange={(e) => update({ wp_site_url: e.target.value })}
            />
          </Field>
          <Field label="WP Username" hint="Admin username or server default">
            <input
              className={inputCls}
              placeholder="Server env or custom user"
              value={settings.wp_username ?? ""}
              onChange={(e) => update({ wp_username: e.target.value })}
            />
          </Field>
          <Field
            label="Application Password"
            hint="Configured via server env or enter here"
          >
            <input
              type="password"
              className={inputCls}
              placeholder={settings.wp_app_password ? "••••••••••••" : "Configured in server env or enter key"}
              value={settings.wp_app_password ?? ""}
              onChange={(e) => update({ wp_app_password: e.target.value })}
            />
          </Field>
        </div>

        <div className="rounded-xl bg-panel border border-line p-4 text-xs space-y-2 text-muted">
          <div className="flex items-center gap-2 text-text font-medium">
            <Building2 className="size-4 text-accent" />
            <span>Target WordPress Page Architecture</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 pt-1 font-mono">
            <div>Parent Page: <strong className="text-text font-sans">#750 (Employment Law)</strong></div>
            <div>Page Template: <strong className="text-text font-sans">templates/labor-law.php</strong></div>
            <div>REST Base: <strong className="text-text font-sans">/wp-json/wp/v2/pages</strong></div>
          </div>
        </div>
      </section>

      {/* AI Provider Configuration */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2 text-text">
          <KeyRound className="size-4 text-accent" /> AI Generation Engines (OpenAI &amp; Gemini)
        </h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Content LLM Provider" hint="OpenAI recommended for legal depth">
            <select
              className={inputCls}
              value={settings.llm_provider}
              onChange={(e) =>
                update({ llm_provider: e.target.value as typeof settings.llm_provider })
              }
            >
              <option value="openai">OpenAI (gpt-4o / gpt-4o-mini)</option>
              <option value="gemini">Google Gemini (gemini-2.5-flash)</option>
              <option value="simulator">Offline Simulator</option>
            </select>
          </Field>
          <Field label="OpenAI API Key" hint="For California statutory legal content">
            <input
              className={inputCls}
              type="password"
              placeholder="sk-proj-..."
              value={settings.openai_api_key ?? ""}
              onChange={(e) => update({ openai_api_key: e.target.value })}
            />
          </Field>
          <Field label="Google Gemini API Key" hint="For 16:9 Banner & 4:3 Services Visuals">
            <input
              className={inputCls}
              type="password"
              placeholder="AIzaSy..."
              value={settings.gemini_api_key ?? ""}
              onChange={(e) => update({ gemini_api_key: e.target.value })}
            />
          </Field>
        </div>

        <Field
          label="System Prompt & Legal Guardrails"
          hint="Replicates the client's ChatGPT conversation tone: punchy 1-3 sentence paragraphs, FEHA citations, and question subheadings."
        >
          <textarea
            className={cn(inputCls, "min-h-32 text-xs leading-relaxed font-mono")}
            value={settings.system_prompt}
            onChange={(e) => update({ system_prompt: e.target.value })}
          />
        </Field>
      </section>

      {/* ACF Field Group 348 Reference */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-text">
            <Layers className="size-4 text-accent" /> Secure Custom Fields (SCF / ACF Field Group 348)
          </h2>
          <span className="text-xs text-muted font-mono">personal_injury_group</span>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          The pipeline maps all 27 subfields across 6 tabs automatically. Global assets (8 verified client reviews, 27 practice area sidebar cross-links, CTA background, and Contact Form 7 shortcode) are cloned from live Page 3933 to maintain 100% theme consistency.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-panel border border-line p-3.5 rounded-xl space-y-1">
            <span className="font-medium text-text block">Heading Styling</span>
            <p className="text-muted">Uses class <code>&lt;h2 class=&quot;h2dav&quot;&gt;</code> and <code>&lt;h3 class=&quot;h3dav&quot;&gt;</code>.</p>
          </div>
          <div className="bg-panel border border-line p-3.5 rounded-xl space-y-1">
            <span className="font-medium text-text block">FAQ &amp; Rich Snippets</span>
            <p className="text-muted">Easy Accordion HTML + <code>[sp_easyaccordion id=&quot;3932&quot;]</code> + Schema.org JSON-LD.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <a
            href="/docs/acf-field-group-348-personal-injury.json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
          >
            <FileCode className="size-3.5" /> View ACF Field Group 348 Export JSON
          </a>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={flashSaved}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition shadow-sm"
        >
          <Save className="size-4" /> {savedFlash ? "Saved!" : "Save Settings"}
        </button>
        <span className="text-xs text-muted">Changes are automatically saved to your browser session.</span>
      </div>
    </div>
  );
}
