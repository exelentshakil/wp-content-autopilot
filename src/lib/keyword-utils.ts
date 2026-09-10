/**
 * Keyword & Practice Area Decomposition Utility
 * Prevents awkward keyword clutter, unnatural repetitions, and title duplications
 * (e.g., eliminates "Glendale Glendale Wrongful Termination Lawyer Attorneys"
 * and "subjected you to Glendale Wrongful Termination Lawyer in Glendale").
 */

export interface DecomposedKeyword {
  city: string;
  cleanTopic: string;
  lawyerTitle: string;
  topicKey:
    | "wrongful_termination"
    | "sexual_harassment"
    | "race_discrimination"
    | "wage_theft"
    | "meal_breaks"
    | "disability"
    | "workplace_retaliation"
    | "family_medical_leave"
    | "age_discrimination"
    | "employment_law";
  subtopic: string;
  heroTitle: string;
  slug: string;
  yoastTitle: string;
  yoastMetaDesc: string;
  yoastFocusKw: string;
}

export const CALIFORNIA_CITIES = [
  "Glendale",
  "Burbank",
  "Los Angeles",
  "Pasadena",
  "Visalia",
  "Fresno",
  "Van Nuys",
  "Studio City",
  "North Hollywood",
  "Long Beach",
  "San Fernando Valley",
  "Orange County",
  "Bakersfield",
  "Sacramento",
  "San Francisco",
  "San Diego",
  "Santa Monica",
  "Beverly Hills",
  "Torrance",
  "Anaheim",
  "Irvine",
  "Riverside",
  "San Bernardino",
  "Ontario",
  "Oakland",
  "San Jose",
  "Stockton",
  "Modesto",
  "Oxnard",
  "Fontana",
  "Santa Clarita",
  "Chula Vista",
  "Fremont",
  "Moreno Valley",
  "Huntington Beach",
];

export function extractCityFromText(text: string): string {
  for (const city of CALIFORNIA_CITIES) {
    const pattern = new RegExp(`\\b${city.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (pattern.test(text)) {
      return city;
    }
  }
  return "California";
}

export function decomposeKeyword(rawKeyword: string, rawCity?: string): DecomposedKeyword {
  const kwTrimmed = (rawKeyword || "").trim();
  let city = (rawCity || "").trim();

  if (!city || city === "California") {
    city = extractCityFromText(kwTrimmed);
  }

  // Strip city from keyword text
  let cleaned = kwTrimmed;
  if (city && city !== "California") {
    cleaned = cleaned.replace(new RegExp(`\\b${city.replace(/\s+/g, "\\s+")}\\b`, "gi"), "");
  }

  // Strip legal terms and common prepositional phrases
  cleaned = cleaned.replace(
    /\b(employment\s+lawyers?|employment\s+attorneys?|labor\s+lawyers?|labor\s+attorneys?|lawyers?|attorneys?|law\s*firm|legal\s*representation|legal\s*advocacy|law\s*office|counsel|group|advocates?)\b/gi,
    ""
  );
  cleaned = cleaned.replace(/\b(in|for|near|around)\s+[A-Za-z\s]+\b/gi, "");
  cleaned = cleaned.trim().replace(/^[-–—:,\s]+|[-–—:,\s]+$/g, "");

  const lower = cleaned.toLowerCase();
  let cleanTopic = "Employment Law";
  let topicKey: DecomposedKeyword["topicKey"] = "employment_law";
  let subtopic = "Worker Rights & Advocacy";

  if (
    lower.includes("wrongful") ||
    lower.includes("termination") ||
    lower.includes("firing") ||
    lower.includes("discharg") ||
    lower.includes("laid off")
  ) {
    cleanTopic = "Wrongful Termination";
    topicKey = "wrongful_termination";
    subtopic = "Unlawful Firing";
  } else if (
    lower.includes("harass") ||
    lower.includes("sexual") ||
    lower.includes("hostile work") ||
    lower.includes("quid pro quo")
  ) {
    cleanTopic = "Sexual Harassment";
    topicKey = "sexual_harassment";
    subtopic = "Hostile Work Environment";
  } else if (
    lower.includes("race") ||
    lower.includes("racial") ||
    lower.includes("color") ||
    lower.includes("ethnic") ||
    lower.includes("crown act")
  ) {
    cleanTopic = "Race Discrimination";
    topicKey = "race_discrimination";
    subtopic = "Workplace Bias";
  } else if (
    lower.includes("wage") ||
    lower.includes("theft") ||
    lower.includes("unpaid") ||
    lower.includes("overtime") ||
    lower.includes("off the clock") ||
    lower.includes("minimum wage") ||
    lower.includes("paycheck")
  ) {
    cleanTopic = "Wage Theft";
    topicKey = "wage_theft";
    subtopic = "Unpaid Wages & Overtime";
  } else if (
    lower.includes("meal") ||
    lower.includes("rest break") ||
    lower.includes("break") ||
    lower.includes("lunch")
  ) {
    cleanTopic = "Meal and Rest Breaks";
    topicKey = "meal_breaks";
    subtopic = "Labor Violations";
  } else if (
    lower.includes("disability") ||
    lower.includes("medical condition") ||
    lower.includes("accommodation") ||
    lower.includes("interactive process") ||
    lower.includes("handicap")
  ) {
    cleanTopic = "Disability Discrimination";
    topicKey = "disability";
    subtopic = "Reasonable Accommodation";
  } else if (
    lower.includes("retaliat") ||
    lower.includes("whistleblow") ||
    lower.includes("whistle")
  ) {
    cleanTopic = "Workplace Retaliation";
    topicKey = "workplace_retaliation";
    subtopic = "Whistleblower Rights";
  } else if (
    lower.includes("leave") ||
    lower.includes("fmla") ||
    lower.includes("cfra") ||
    lower.includes("pregnancy") ||
    lower.includes("maternity") ||
    lower.includes("paternity") ||
    lower.includes("family")
  ) {
    cleanTopic = "Family and Medical Leave";
    topicKey = "family_medical_leave";
    subtopic = "Protected Workplace Leave";
  } else if (lower.includes("age") || lower.includes("older worker")) {
    cleanTopic = "Age Discrimination";
    topicKey = "age_discrimination";
    subtopic = "Older Worker Rights";
  } else if (cleaned.length >= 3) {
    cleanTopic = cleaned
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    subtopic = "Workplace Justice";
  }

  const lawyerTitle = `${city} ${cleanTopic} Lawyer`;
  const heroTitle = `${city} ${cleanTopic} Employment Lawyers - ${subtopic}`;
  const slug = `${city.toLowerCase()}-${cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-lawyer`
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const yoastTitle = `${city} ${cleanTopic} Lawyer | Atoyan Law`;
  const yoastMetaDesc = `Experienced ${city} ${cleanTopic.toLowerCase()} attorney fighting for California workers. Protect your workplace rights & recover compensation. Call (888) 807-0077.`;
  const yoastFocusKw = `${city} ${cleanTopic.toLowerCase()} lawyer`;

  return {
    city,
    cleanTopic,
    lawyerTitle,
    topicKey,
    subtopic,
    heroTitle,
    slug,
    yoastTitle,
    yoastMetaDesc,
    yoastFocusKw,
  };
}
