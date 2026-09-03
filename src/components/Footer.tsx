"use client";

import { ArrowRight, CheckCircle2, Shield, Zap, Code2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Footer() {
  const [showProposal, setShowProposal] = useState(false);

  return (
    <footer className="border-t border-line bg-panel-2 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Your rules, running on autopilot</h3>
              <p className="text-muted leading-relaxed">
                This isn't a generic "AI writes your blog" wrapper. Every formatting decision — heading class,
                CTA placement, keyword links, ACF field names — is config you control in Settings, not a prompt
                you have to re-explain every time.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="mt-1 size-5 rounded bg-accent/10 flex items-center justify-center shrink-0">
                  <Shield className="size-3 text-accent" />
                </div>
                <div>
                  <div className="font-medium text-sm">Rule-driven, not black-box</div>
                  <div className="text-xs text-muted mt-1">Heading class, CTA, links — all editable, all audited.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 size-5 rounded bg-accent/10 flex items-center justify-center shrink-0">
                  <Link2 className="size-3 text-accent" />
                </div>
                <div>
                  <div className="font-medium text-sm">ACF-mapped</div>
                  <div className="text-xs text-muted mt-1">Content lands in your exact field names, not a guess.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 size-5 rounded bg-accent/10 flex items-center justify-center shrink-0">
                  <Zap className="size-3 text-accent" />
                </div>
                <div>
                  <div className="font-medium text-sm">Zero-setup demo</div>
                  <div className="text-xs text-muted mt-1">Every external call has a fallback — click and it just works.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 size-5 rounded bg-accent/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-3 text-accent" />
                </div>
                <div>
                  <div className="font-medium text-sm">Publish or schedule</div>
                  <div className="text-xs text-muted mt-1">Instant post, or `status: future` for a set date/time.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Code2 className="size-5 text-accent" />
              Enterprise Implementation Architecture
            </h3>

            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-line pb-4">
                <div>
                  <div className="text-sm font-medium text-muted uppercase tracking-wider mb-1">Timeline</div>
                  <div className="text-2xl font-bold font-mono">2 Days</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-muted uppercase tracking-wider mb-1">Total Investment</div>
                  <div className="text-2xl font-bold font-mono text-accent">$100</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted flex items-center gap-2"><CheckCircle2 className="size-4 text-good"/> Generation + formatting pipeline</span>
                  <span className="font-mono">done</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted flex items-center gap-2"><CheckCircle2 className="size-4 text-good"/> Topic image generation</span>
                  <span className="font-mono">done</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted flex items-center gap-2"><CheckCircle2 className="size-4 text-good"/> ACF mapping + WP publish</span>
                  <span className="font-mono">done</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted flex items-center gap-2"><ArrowRight className="size-4 text-accent"/> Wire to your real site</span>
                  <span className="font-mono">on go-ahead</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted flex items-center gap-2"><ArrowRight className="size-4 text-accent"/> Match your .psd templates</span>
                  <span className="font-mono">on go-ahead</span>
                </div>
              </div>

              <button
                onClick={() => setShowProposal(!showProposal)}
                className="w-full mt-4 py-3 bg-panel-2 hover:bg-line border border-line rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Read Full Cover Letter
                <ArrowRight className={cn("size-4 transition-transform", showProposal && "rotate-90")} />
              </button>

              {showProposal && (
                  <div className="mt-4 p-4 bg-line/30 rounded border border-line/50 text-sm text-muted space-y-4">
                    <p>What you are looking at is not a simple script; it is a scalable, programmatic SEO publishing engine. By stripping away manual formatting and strictly enforcing your custom CSS and ACF schemas, we are building a production line capable of dominating high-value SERPs with zero manual bottleneck.</p>
                  </div>

                <div className="pt-4 text-sm text-muted leading-relaxed space-y-4 animate-in fade-in slide-in-from-top-2">
                  <p>Your real worry isn&apos;t &quot;can AI write an article&quot; — it&apos;s whether the output actually follows YOUR rules, or if you&apos;re back to fixing generic AI formatting by hand.</p>
                  <p>Everything here is config, not code: heading class, CTA position, keyword→URL dictionary, and ACF field names all live in Settings. Change your rules without asking me to change the app.</p>
                  <p>Honest gap: the image templates aren&apos;t your exact .psd files yet, and WordPress publishing runs simulated until I have your site&apos;s application password.</p>
                  <p className="font-medium text-text mt-4 pt-4 border-t border-line">$100 fixed, 2 days. Ready to start today.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-line flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted">
          <div>Built specifically for David&apos;s WordPress/ACF content automation brief.</div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/exelentshakil/wp-content-autopilot" target="_blank" rel="noreferrer" className="hover:text-text transition-colors">View Source on GitHub</a>
            <a href="https://shakilhq.com" target="_blank" rel="noreferrer" className="hover:text-text transition-colors">shakilhq.com Portfolio</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
