"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, KeyRound, Globe, Layers } from "lucide-react";
import { useSettings } from "@/lib/useSettings";
import { cn } from "@/lib/utils";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-text">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40";

export default function SettingsPage() {
  const { settings, update, ready } = useSettings();
  const [savedFlash, setSavedFlash] = useState(false);

  if (!ready) return null;

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const addKeyword = () =>
    update({ keyword_links: [...settings.keyword_links, { keyword: "", url: "" }] });

  const removeKeyword = (i: number) =>
    update({ keyword_links: settings.keyword_links.filter((_, idx) => idx !== i) });

  const updateKeyword = (i: number, patch: Partial<{ keyword: string; url: string }>) =>
    update({
      keyword_links: settings.keyword_links.map((k, idx) => (idx === i ? { ...k, ...patch } : k)),
    });

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <h1 className="text-2xl font-semibold mt-3">Settings</h1>
        <p className="text-muted mt-1 text-sm max-w-2xl">
          Every rule the pipeline runs on comes from here. Nothing is hardcoded — plug in your real API key,
          WordPress site, and formatting rules and the demo becomes your production tool. Everything is stored
          only in this browser (localStorage) — nothing is sent anywhere except to generate or publish on your
          command.
        </p>
      </div>

      {/* LLM provider */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <KeyRound className="size-4 text-accent" /> Article generation
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Provider">
            <select
              className={inputCls}
              value={settings.llm_provider}
              onChange={(e) => update({ llm_provider: e.target.value as typeof settings.llm_provider })}
            >
              <option value="simulator">Simulator (no key needed)</option>
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
          </Field>
          <Field label="Gemini API key">
            <input
              className={inputCls}
              type="password"
              placeholder="AIza..."
              value={settings.gemini_api_key ?? ""}
              onChange={(e) => update({ gemini_api_key: e.target.value })}
            />
          </Field>
          <Field label="OpenAI API key">
            <input
              className={inputCls}
              type="password"
              placeholder="sk-..."
              value={settings.openai_api_key ?? ""}
              onChange={(e) => update({ openai_api_key: e.target.value })}
            />
          </Field>
        </div>
        <Field label="System prompt" hint="Paste your trained ChatGPT Project instructions here.">
          <textarea
            className={cn(inputCls, "min-h-28")}
            value={settings.system_prompt}
            onChange={(e) => update({ system_prompt: e.target.value })}
          />
        </Field>
      </section>

      {/* Formatting rules */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <Layers className="size-4 text-accent" /> Formatting rules
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Heading CSS class" hint='e.g. "david" → <h3 class="david">'>
            <input
              className={inputCls}
              value={settings.heading_class}
              onChange={(e) => update({ heading_class: e.target.value })}
            />
          </Field>
          <Field label="CTA shortcode">
            <input
              className={inputCls}
              value={settings.cta_shortcode}
              onChange={(e) => update({ cta_shortcode: e.target.value })}
            />
          </Field>
          <Field label="Insert CTA after paragraph #">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={settings.cta_after_paragraph}
              onChange={(e) => update({ cta_after_paragraph: Number(e.target.value) || 1 })}
            />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Keyword auto-link dictionary</span>
            <button
              onClick={addKeyword}
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {settings.keyword_links.map((k, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={cn(inputCls, "flex-1")}
                  placeholder="keyword"
                  value={k.keyword}
                  onChange={(e) => updateKeyword(i, { keyword: e.target.value })}
                />
                <input
                  className={cn(inputCls, "flex-1")}
                  placeholder="/url/"
                  value={k.url}
                  onChange={(e) => updateKeyword(i, { url: e.target.value })}
                />
                <button
                  onClick={() => removeKeyword(i)}
                  className="shrink-0 rounded-lg border border-line px-2 text-muted hover:text-bad hover:border-bad/40 transition"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Image template">
          <select
            className={inputCls}
            value={settings.image_template}
            onChange={(e) => update({ image_template: e.target.value as typeof settings.image_template })}
          >
            <option value="sunset">Sunset</option>
            <option value="midnight">Midnight</option>
            <option value="paper">Paper</option>
          </select>
        </Field>
      </section>

      {/* WordPress */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <Globe className="size-4 text-accent" /> WordPress connection
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Site URL">
            <input
              className={inputCls}
              placeholder="https://your-site.com"
              value={settings.wp_site_url ?? ""}
              onChange={(e) => update({ wp_site_url: e.target.value })}
            />
          </Field>
          <Field label="Username">
            <input
              className={inputCls}
              value={settings.wp_username ?? ""}
              onChange={(e) => update({ wp_username: e.target.value })}
            />
          </Field>
          <Field label="Application password" hint="Users → Profile → Application Passwords in wp-admin">
            <input
              type="password"
              className={inputCls}
              value={settings.wp_app_password ?? ""}
              onChange={(e) => update({ wp_app_password: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(
            [
              ["title_field", "Title field"],
              ["body_field", "Body field"],
              ["cta_field", "CTA field"],
              ["image1_field", "Image 1 field"],
              ["image2_field", "Image 2 field"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className={inputCls}
                value={settings.acf_mapping[key]}
                onChange={(e) => update({ acf_mapping: { ...settings.acf_mapping, [key]: e.target.value } })}
              />
            </Field>
          ))}
        </div>
      </section>

      <button
        onClick={flashSaved}
        className="inline-flex items-center gap-2 rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
      >
        <Save className="size-4" /> {savedFlash ? "Saved" : "Settings save automatically"}
      </button>
    </div>
  );
}
