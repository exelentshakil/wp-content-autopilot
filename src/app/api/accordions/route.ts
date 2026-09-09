import { NextResponse } from "next/server";

export const runtime = "nodejs";

const KNOWN_ACCORDIONS = [
  {
    "id": 4355,
    "title": "Burbank Race Discrimination Attorney",
    "shortcode": "[sp_easyaccordion id=\"4355\"]",
    "topic": "Race Discrimination"
  },
  {
    "id": 4200,
    "title": "Burbank Hostile Work Environment Lawyer",
    "shortcode": "[sp_easyaccordion id=\"4200\"]",
    "topic": "Hostile Work Environment"
  },
  {
    "id": 4176,
    "title": "Burbank Wrongful Termination Lawyer",
    "shortcode": "[sp_easyaccordion id=\"4176\"]",
    "topic": "Wrongful Termination"
  },
  {
    "id": 4167,
    "title": "Burbank Wage Theft Attorney",
    "shortcode": "[sp_easyaccordion id=\"4167\"]",
    "topic": "Wage Theft"
  },
  {
    "id": 4119,
    "title": "Visalia Meal and Rest Break Violations",
    "shortcode": "[sp_easyaccordion id=\"4119\"]",
    "topic": "Meal & Rest Breaks"
  },
  {
    "id": 4095,
    "title": "Fresno Meal and Rest Break Violations",
    "shortcode": "[sp_easyaccordion id=\"4095\"]",
    "topic": "Meal & Rest Breaks (Fresno)"
  },
  {
    "id": 4086,
    "title": "Fresno Wage Theft Attorney",
    "shortcode": "[sp_easyaccordion id=\"4086\"]",
    "topic": "Wage Theft (Fresno)"
  },
  {
    "id": 3894,
    "title": "Burbank Disability Discrimination Lawyer",
    "shortcode": "[sp_easyaccordion id=\"3894\"]",
    "topic": "Disability Discrimination"
  },
  {
    "id": 3877,
    "title": "Burbank Gender Discrimination Lawyer",
    "shortcode": "[sp_easyaccordion id=\"3877\"]",
    "topic": "Gender Discrimination"
  },
  {
    "id": 3788,
    "title": "Burbank Medical Leave Lawyer",
    "shortcode": "[sp_easyaccordion id=\"3788\"]",
    "topic": "Medical / CFRA Leave"
  },
  {
    "id": 3740,
    "title": "Burbank Retaliation Lawyer",
    "shortcode": "[sp_easyaccordion id=\"3740\"]",
    "topic": "Retaliation / Whistleblower"
  },
  {
    "id": 3719,
    "title": "Burbank Overtime Violations Lawyer",
    "shortcode": "[sp_easyaccordion id=\"3719\"]",
    "topic": "Overtime Violations"
  },
  {
    "id": 3619,
    "title": "Fresno Overtime Violations Lawyer",
    "shortcode": "[sp_easyaccordion id=\"3619\"]",
    "topic": "Overtime (Fresno)"
  },
  {
    "id": 3464,
    "title": "Burbank Sexual Harassment Lawyer",
    "shortcode": "[sp_easyaccordion id=\"3464\"]",
    "topic": "Sexual Harassment"
  },
  {
    "id": 3932,
    "title": "California Adverse Employment Action",
    "shortcode": "[sp_easyaccordion id=\"3932\"]",
    "topic": "General Employment Law"
  }
];

export async function GET() {
  const wpSiteUrl = process.env.WP_SITE_URL?.trim() || "https://www.atoyanlaw.com";
  const cleanBase = wpSiteUrl.replace(/\/$/, "");
  const wpUser = process.env.WP_USER?.trim();
  const wpPassword = process.env.WP_PASSWORD?.trim();

  // Try fetching live accordions from WordPress REST API if credentials available
  if (wpUser && wpPassword) {
    try {
      const authHeader = Buffer.from(`${wpUser}:${wpPassword}`).toString("base64");
      const res = await fetch(`${cleanBase}/wp-json/wp/v2/sp_easy_accordion?per_page=100`, {
        headers: { Authorization: `Basic ${authHeader}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        const liveItems = await res.json();
        if (Array.isArray(liveItems) && liveItems.length > 0) {
          const mapped = liveItems.map((item) => ({
            id: item.id,
            title: item.title?.rendered || `Accordion ${item.id}`,
            shortcode: `[sp_easyaccordion id="${item.id}"]`,
          }));
          return NextResponse.json({ accordions: mapped, source: "live" });
        }
      }
    } catch {
      // Fallback to known catalog
    }
  }

  return NextResponse.json({ accordions: KNOWN_ACCORDIONS, source: "catalog" });
}
