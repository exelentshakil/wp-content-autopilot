import type { Settings } from "./types";

export interface PublishResult {
  mode: "live" | "simulated";
  post_url?: string;
  post_id?: number;
  status: "publish" | "future";
  scheduled_for?: string;
  acf_payload: Record<string, unknown>;
}

/**
 * Publishes into WordPress via the REST API. ACF fields ride along in the
 * standard `acf` object, which the ACF-to-REST-API plugin (or ACF 6's native
 * REST support) accepts directly on /wp/v2/posts.
 *
 * With no WP credentials configured, this returns a clearly-labelled
 * simulated result so the flow can be reviewed end to end with zero setup.
 */
export async function publishToWordPress(params: {
  title: string;
  body: string;
  cta: string;
  image1Url?: string;
  image2Url?: string;
  scheduleAt?: string;
  settings: Settings;
}): Promise<PublishResult> {
  const { title, body, cta, image1Url, scheduleAt, settings } = params;
  const m = settings.acf_mapping;

  const acf_payload: Record<string, unknown> = {
    [m.body_field]: body,
    [m.cta_field]: cta,
    [m.image1_field]: image1Url ?? null,
    [m.image2_field]: null,
  };

  const status = scheduleAt ? "future" : "publish";

  if (!settings.wp_site_url || !settings.wp_username || !settings.wp_app_password) {
    return {
      mode: "simulated",
      status,
      scheduled_for: scheduleAt,
      post_url: `${settings.wp_site_url?.replace(/\/$/, "") || "https://your-site.example"}/?p=simulated`,
      acf_payload,
    };
  }

  const base = settings.wp_site_url.replace(/\/$/, "");
  const auth = Buffer.from(`${settings.wp_username}:${settings.wp_app_password}`).toString("base64");

  const res = await fetch(`${base}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      title,
      status,
      date: scheduleAt,
      acf: acf_payload,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`WordPress publish failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  }

  const json = await res.json();
  return {
    mode: "live",
    status,
    scheduled_for: scheduleAt,
    post_id: json.id,
    post_url: json.link,
    acf_payload,
  };
}
