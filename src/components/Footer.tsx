"use client";

import { CheckCircle2, ChevronDown, Code2, Database, Layout, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Wand2,
    title: "Zero-Touch Formatting",
    body: "Strips markdown artifacts, wraps elements in your exact CSS classes, and drops CTAs exactly where you want them.",
  },
  {
    icon: Layout,
    title: "ACF Schema Mapping",
    body: "Maps the generated content directly into your Advanced Custom Fields payload, not just a big text blob.",
  },
  {
    icon: Database,
    title: "Keyword Auto-Linking",
    body: "Automatically links terms against your custom dictionary to build internal SEO structure on the fly.",
  },
  {
    icon: Sparkles,
    title: "Generative Covers",
    body: "Builds a featured topic image with the title baked in. Zero Photoshop required before publishing.",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-panel-2 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Programmatic SEO Publishing</h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                The real worry isn't "can AI write an article" — it's whether the output actually follows YOUR rules, or if you're back to fixing generic AI formatting by hand. Everything here is config, not code.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="mt-0.5 size-8 shrink-0 rounded-lg bg-accent/10 flex items-center justify-center">
                    <f.icon className="size-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{f.title}</h4>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-8 bg-panel shadow-sm">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Code2 className="size-5 text-accent" />
              Enterprise Implementation Architecture
            </h3>

            <div className="mt-6 space-y-6">
              <div className="text-sm text-muted leading-relaxed space-y-4">
                <p>What you are looking at is not a simple script; it is a scalable, programmatic SEO publishing engine. By stripping away manual formatting and strictly enforcing your custom CSS and ACF schemas, we are building a production line capable of dominating high-value SERPs with zero manual bottleneck.</p>
                
                <p>This pipeline connects directly to your WordPress installation via application passwords, maps directly to your custom post types, and can run on a cron schedule to publish completely hands-free.</p>
              </div>

              <div className="pt-5 border-t border-line space-y-3">
                <div className="flex items-center text-xs">
                  <span className="text-muted flex items-center gap-2"><CheckCircle2 className="size-3.5 text-good"/> Architecture & Payload Mapping</span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="text-muted flex items-center gap-2"><CheckCircle2 className="size-3.5 text-good"/> Formatting Engine (CSS/CTA logic)</span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="text-muted flex items-center gap-2"><CheckCircle2 className="size-3.5 text-good"/> Auto-Linking & Media Gen</span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="text-muted flex items-center gap-2"><CheckCircle2 className="size-3.5 text-good"/> WordPress REST API Integration</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-line flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted">
          <div>Built as an enterprise proof-of-concept.</div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/exelentshakil/wp-content-autopilot" target="_blank" rel="noreferrer" className="hover:text-text transition-colors">View Source on GitHub</a>
            <a href="https://shakilhq.com" target="_blank" rel="noreferrer" className="hover:text-text transition-colors">shakilhq.com Portfolio</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
