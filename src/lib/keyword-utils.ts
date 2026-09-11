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
  "Agoura Hills",
  "Alhambra",
  "Aliso Viejo",
  "Anaheim",
  "Antioch",
  "Apple Valley",
  "Arcadia",
  "Bakersfield",
  "Baldwin Park",
  "Bellflower",
  "Berkeley",
  "Beverly Hills",
  "Brea",
  "Burbank",
  "Calabasas",
  "Camarillo",
  "Carlsbad",
  "Carson",
  "Cerritos",
  "Chico",
  "Chino",
  "Chino Hills",
  "Chula Vista",
  "Citrus Heights",
  "Claremont",
  "Clovis",
  "Compton",
  "Concord",
  "Corona",
  "Costa Mesa",
  "Covina",
  "Culver City",
  "Daly City",
  "Dana Point",
  "Davis",
  "Diamond Bar",
  "Downey",
  "El Cajon",
  "El Monte",
  "El Segundo",
  "Elk Grove",
  "Encinitas",
  "Escondido",
  "Fairfield",
  "Folsom",
  "Fontana",
  "Fountain Valley",
  "Fremont",
  "Fresno",
  "Fullerton",
  "Garden Grove",
  "Gardena",
  "Glendale",
  "Glendora",
  "Hawthorne",
  "Hayward",
  "Hemet",
  "Hesperia",
  "Huntington Beach",
  "Indio",
  "Inglewood",
  "Irvine",
  "La Habra",
  "La Mesa",
  "La Mirada",
  "Laguna Beach",
  "Laguna Hills",
  "Laguna Niguel",
  "Lake Forest",
  "Lakewood",
  "Lancaster",
  "Livermore",
  "Lodi",
  "Long Beach",
  "Los Angeles",
  "Malibu",
  "Manhattan Beach",
  "Manteca",
  "Menifee",
  "Merced",
  "Mission Viejo",
  "Modesto",
  "Monrovia",
  "Montclair",
  "Montebello",
  "Monterey Park",
  "Moorpark",
  "Moreno Valley",
  "Mountain View",
  "Murrieta",
  "Napa",
  "Newport Beach",
  "Norwalk",
  "Novato",
  "Oakland",
  "Oceanside",
  "Ontario",
  "Orange",
  "Oxnard",
  "Palm Desert",
  "Palm Springs",
  "Palmdale",
  "Palo Alto",
  "Pasadena",
  "Perris",
  "Petaluma",
  "Pico Rivera",
  "Placentia",
  "Pleasanton",
  "Pomona",
  "Rancho Cordova",
  "Rancho Cucamonga",
  "Redding",
  "Redlands",
  "Redondo Beach",
  "Redwood City",
  "Rialto",
  "Richmond",
  "Riverside",
  "Rosemead",
  "Roseville",
  "Sacramento",
  "Salinas",
  "San Bernardino",
  "San Clemente",
  "San Diego",
  "San Fernando",
  "San Francisco",
  "San Gabriel",
  "San Jose",
  "San Leandro",
  "San Luis Obispo",
  "San Marcos",
  "San Mateo",
  "San Rafael",
  "San Ramon",
  "Santa Ana",
  "Santa Barbara",
  "Santa Clara",
  "Santa Clarita",
  "Santa Cruz",
  "Santa Maria",
  "Santa Monica",
  "Santa Rosa",
  "Santee",
  "Simi Valley",
  "South Gate",
  "South Pasadena",
  "Stockton",
  "Sunnyvale",
  "Temecula",
  "Thousand Oaks",
  "Torrance",
  "Tracy",
  "Turlock",
  "Tustin",
  "Union City",
  "Upland",
  "Vacaville",
  "Vallejo",
  "Ventura",
  "Victorville",
  "Visalia",
  "Vista",
  "Walnut",
  "Walnut Creek",
  "West Covina",
  "West Hollywood",
  "Westminster",
  "Whittier",
  "Woodland",
  "Yorba Linda",
  "Yuba City",
  // Regions & LA neighborhoods
  "San Fernando Valley",
  "San Gabriel Valley",
  "Orange County",
  "Inland Empire",
  "Van Nuys",
  "Studio City",
  "North Hollywood",
  "Sherman Oaks",
  "Encino",
  "Tarzana",
  "Woodland Hills",
  "Canoga Park",
  "Reseda",
  "Northridge",
  "Chatsworth",
  "Porter Ranch",
  "Granada Hills",
  "Sylmar",
  "Pacoima",
  "Sun Valley",
  "Panorama City",
  "Sunland",
  "Tujunga",
  "Valencia",
  "Canyon Country",
  "Newhall",
  "Saugus",
].sort((a, b) => b.length - a.length);

export function extractCityFromText(text: string): string {
  if (!text || typeof text !== "string") return "California";

  // 1. Exact match against known California cities & regions (sorted by length desc)
  for (const city of CALIFORNIA_CITIES) {
    const pattern = new RegExp(`\\b${city.replace(/\\s+/g, "\\\\s+")}\\b`, "i");
    if (pattern.test(text)) {
      return city;
    }
  }

  // 2. Dynamic regex fallback: strip legal topic & suffixes to discover custom cities
  const legalSuffixes = /\\b(employment\\s+lawyers?|employment\\s+attorneys?|labor\\s+lawyers?|labor\\s+attorneys?|lawyers?|attorneys?|law\\s*firm|legal\\s*representation|legal\\s*advocacy|law\\s*office|counsel|group|advocates?)\\b/gi;
  const legalTopics = /\\b(sexual\\s+harassment|wrongful\\s+termination|unlawful\\s+termination|unlawful\\s+firing|wrongful\\s+discharge|wage\\s+theft|unpaid\\s+wages|overtime\\s+violations?|overtime|wage\\s+and\\s+hour|race\\s+discrimination|racial\\s+discrimination|disability\\s+discrimination|pregnancy\\s+discrimination|age\\s+discrimination|gender\\s+discrimination|sex\\s+discrimination|religious\\s+discrimination|national\\s+origin\\s+discrimination|workplace\\s+harassment|hostile\\s+work\\s+environment|quid\\s+pro\\s+quo|meal\\s+and\\s+rest\\s+breaks?|meal\\s+breaks?|rest\\s+breaks?|workplace\\s+retaliation|whistleblower\\s+retaliation|whistleblower|retaliation|severance\\s+agreements?|severance|family\\s+and\\s+medical\\s+leave|family\\s+medical\\s+leave|fmla|cfra|employment\\s+law|labor\\s+law)\\b/gi;

  let candidate = text.trim();
  candidate = candidate.replace(/\\b(in|for|near|around|at)\\s+/gi, " ");
  candidate = candidate.replace(legalSuffixes, " ");
  candidate = candidate.replace(legalTopics, " ");
  candidate = candidate.replace(/[-–—:,]/g, " ").replace(/\\s+/g, " ").trim();

  if (
    candidate.length >= 2 &&
    candidate.toLowerCase() !== "california" &&
    candidate.toLowerCase() !== "ca"
  ) {
    return candidate
      .split(/\\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
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
  const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const topicSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const slug = `${citySlug}-${topicSlug}-lawyer`
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
