import type {
  AtoyanLegalContent,
  AtoyanFaq,
  AcfPersonalInjuryGroup,
  TestimonialReviewItem,
} from "./types";

export const ATOYAN_PARENT_PAGE_ID = 750; // /practice-areas/employment-law/
export const ATOYAN_TEMPLATE = "templates/labor-law.php";
export const ATOYAN_REFERENCE_PAGE_ID = 3898;
export const ATOYAN_BANNER_ATTACHMENT_ID = 3899;
export const ATOYAN_TESTIMONIALS_BG_ATTACHMENT_ID = 72;
export const ATOYAN_CTA_BG_ATTACHMENT_ID = 383;

export const ATOYAN_PHONE = "(747) 888-0077";
export const ATOYAN_TOLL_FREE = "(888) 807-0077";
export const ATOYAN_PHONE_LINK = "tel:747888-0077";
export const ATOYAN_CONTACT_URL = "https://www.atoyanlaw.com/contact/";

/**
 * Cloned sidebar practice area page IDs from Page 3933.
 * Preserves the exact 27 employment law cross-links on Atoyan Law Firm.
 */
export const ATOYAN_DEFAULT_SIDEBAR_IDS: number[] = [
  1590, 770, 791, 808, 821, 838, 852, 872, 888, 908, 925, 951, 970, 1070, 1090, 1044,
  1622, 3720, 3278, 3266, 3271, 3739, 3789, 3831, 3752, 3780, 3878,
];

export const ATOYAN_TESTIMONIALS_BG_IMAGE =
  "https://www.atoyanlaw.com/wp-content/uploads/2025/01/reviews-s1-bg.2311141957550.jpg";
export const ATOYAN_TESTIMONIALS_HEADING = "Testimonials";
export const ATOYAN_TESTIMONIALS_SUB_HEADING = "Hear from Our Former Clients";

export const ATOYAN_TESTIMONIALS_REVIEWS: TestimonialReviewItem[] = [
  {
    title: "\"I recommend Atoyan Law with your legal concerns.\"",
    description:
      "I just had a consultation with attorny Angela Atoyan. I am very satisfied with her professionalism. I am really and highly recommending to hire her as your attorney. Thank you",
    name: "-  Hak H.",
  },
  {
    title: "\"Thanks Atoyan Employment Law\"",
    description:
      "The legal team at Atoyan Employment law took my case almost from the first call. I had asked other firms but never got an answer, not even to reject my case. Great communication was a constant experience with Atoyan Employment Law.",
    name: "- Edgar P.",
  },
  {
    title:
      "\"Angela Atoyan and her professional staff helped us a ton with the employement questions and related topics.\"",
    description:
      "They are always supportive, efficient, and a pleasure to work with manager and also paralegals. Their professionalism and collaborative spirit truly make a difference. Highly recommended!!!",
    name: "- Karen A.",
  },
  {
    title: "\"I really felt like they had my best interests in mind.\"",
    description:
      "Communication was excellent they kept me updated without me ever having to chase them down. They answered all my questions and walked me through everything so I never felt overwhelmed.",
    name: "- Edgar A.",
  },
  {
    title: "\"I highly recommend this firm for your legal services.\"",
    description:
      "I had excellent experience with the team. HUGE THANKS for helping me when i needed it the most. RECOMMEND 100%",
    name: "- Yuri M.",
  },
  {
    title: "\"I highly recommend Atoyan Law for your legal concerns and services!\"",
    description:
      "I am empressed by their work responsibility. Every time i called they answered all my questions, help me with every problem that the accident caused.\r\n100% reccommended",
    name: "- George A.",
  },
  {
    title: "\"Highly recommend Atoyan law for a smooth process.\"",
    description:
      "Atoyan law has a very responsible team. Angela helped me apply for a family reunion. Everything was done on time and perfectly and they answered my phone call immediately.",
    name: "- Lusine K.",
  },
  {
    title: "\"I would recommend this office to everyone.\"",
    description:
      "I had a great experience working with Atoyan Employment Law. The team was very knowledgeable, caring, and professional throughout the entire process. I highly recommend Atoyan Employment Law to anyone in need of legal assistance.",
    name: "- Maria K.",
  },
];

export const ATOYAN_TESTIMONIALS_BUTTON = {
  title: "View All Testimonials",
  url: "https://www.atoyanlaw.com/testimonials/",
  target: "",
};

export const ATOYAN_CONTACT_FORM_HEADING = "Contact Us for Your Consultation";
export const ATOYAN_CONTACT_FORM_SHORTCODE = '[contact-form-7 id="2701763" title="Home page"]';

export const ATOYAN_CTA_BG_IMAGE =
  "https://www.atoyanlaw.com/wp-content/uploads/2025/01/cta-s3-bg3.2402081138550.jpg";
export const ATOYAN_CTA_HEADING = "Get The Representation You Deserve";
export const ATOYAN_CTA_CONTENT =
  "Backed by our experience and skill we fight every case as if our client is our close family member, and our attorneys offer personalized, face-to-face service. Contact us today to get started with your consultation.";
export const ATOYAN_CTA_BUTTON = {
  title: "Contact Us",
  url: "/contact/",
  target: "",
};

/**
 * Builds the signature Atoyan Law callout box with exact theme CSS classes.
 */
export function formatCalloutBox(
  mainText: string,
  linkCtaText = "Call (888) 807-0077 or contact us online",
): string {
  return `<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>${mainText} <a href="${ATOYAN_PHONE_LINK}">${ATOYAN_PHONE}</a> or <a href="${ATOYAN_CONTACT_URL}">${linkCtaText}</a> to schedule a confidential legal consultation with Atoyan Law Firm.</strong></em></p>`;
}

/**
 * Generates valid Schema.org FAQPage JSON-LD snippet for high SEO rich snippet rankings.
 */
export function generateFaqSchemaJsonLd(faqs: AtoyanFaq[]): string {
  if (!faqs || faqs.length === 0) return "";

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer.trim(),
      },
    })),
  };

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generates an interactive, responsive HTML accordion matching Easy Accordion / theme styling,
 * followed by the native [sp_easyaccordion id="3932"] shortcode so both rendering paths succeed.
 */
export function generateEasyAccordionHtml(faqs: AtoyanFaq[] = [], shortcodeId = 3932): string {
  // CRITICAL CLIENT REQUIREMENT (Client David):
  // Strictly maintain zero raw <style>, zero <script>, and zero JSON-LD schema in content fields.
  // Native Easy Accordion shortcode [sp_easyaccordion id="..."] is processed server-side
  // by the Easy Accordion WordPress plugin.
  return `[sp_easyaccordion id="${shortcodeId}"]`;
}

/**
 * Formats the services content, injecting the editorial illustration <img> tag at the top left.
 */
export function buildServicesContent(
  rawServicesHtml: string,
  servicesImageUrl?: string,
  imageAltText?: string,
  attachmentId?: number,
): string {
  const cleanHtml = (rawServicesHtml || "").trim();
  if (!servicesImageUrl) return cleanHtml;

  const wpClass = attachmentId ? `wp-image-${attachmentId}` : "wp-image-3936";
  const imgTag = `<img src="${servicesImageUrl}" alt="${imageAltText || "California Employment Law Legal Representation"}" width="600" height="400" class="alignleft size-full ${wpClass}" />\r\n`;

  // Prepend image if not already present
  if (cleanHtml.includes("<img") && cleanHtml.includes(servicesImageUrl)) {
    return cleanHtml;
  }

  return `${imgTag}${cleanHtml}`;
}

/**
 * Maps practice area keywords and cities to existing Easy Accordion IDs on atoyanlaw.com.
 */
export function resolveDefaultAccordionShortcode(keyword: string, city = "California"): string {
  const kw = (keyword + " " + city).toLowerCase();

  // San Pedro specific
  if (kw.includes("san pedro")) {
    if (kw.includes("race") || kw.includes("racial") || kw.includes("ethnic") || kw.includes("national origin") || kw.includes("color")) {
      return '[sp_easyaccordion id="3531"]'; // Ethnic & National Origin Discrimination Attorney in San Pedro
    }
    if (kw.includes("sick") || kw.includes("time off") || kw.includes("pto") || kw.includes("paid sick")) {
      return '[sp_easyaccordion id="3515"]'; // Paid Sick Time Off rights and attorneys in San Pedro
    }
    if (kw.includes("overtime")) {
      return '[sp_easyaccordion id="3504"]'; // Overtime Compensation Attorney in San Pedro
    }
    if (kw.includes("harass") || kw.includes("sexual")) {
      return '[sp_easyaccordion id="3464"]'; // San Pedro Sexual Harassment Lawyer
    }
    if (kw.includes("wrongful") || kw.includes("termination") || kw.includes("firing") || kw.includes("fired")) {
      return '[sp_easyaccordion id="3421"]'; // Wrongful Termination Lawyer San Pedro CA
    }
    if (kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid") || kw.includes("pay")) {
      return '[sp_easyaccordion id="3971"]'; // Unpaid Wages Employment Attorney San Pedro
    }
    return '[sp_easyaccordion id="3960"]'; // Employment Attorney San Pedro, CA
  }

  // Visalia specific
  if (kw.includes("visalia")) {
    if (kw.includes("meal") || kw.includes("rest break") || kw.includes("lunch") || kw.includes("break")) {
      return '[sp_easyaccordion id="4119"]'; // Visalia Meal and Rest Break Violations
    }
    if (kw.includes("gender") || kw.includes("sex") || kw.includes("women") || kw.includes("equal pay")) {
      return '[sp_easyaccordion id="3873"]'; // Visalia Gender Discrimination Lawyer
    }
    if (kw.includes("leave") || kw.includes("fmla") || kw.includes("cfra") || kw.includes("medical leave") || kw.includes("family")) {
      return '[sp_easyaccordion id="3788"]'; // Visalia Family and Medical Leave Lawyer
    }
    if (kw.includes("overtime")) {
      return '[sp_easyaccordion id="3719"]'; // overtime violations in Visalia
    }
    if (kw.includes("wage") || kw.includes("unpaid") || kw.includes("hour claims") || kw.includes("claims")) {
      return '[sp_easyaccordion id="3779"]'; // Visalia Wage and Hour Claims Attorney
    }
    if (kw.includes("theft") || kw.includes("unpaid wages")) {
      return '[sp_easyaccordion id="3830"]'; // Visalia Unpaid Wages Lawyer
    }
    if (kw.includes("discrim") || kw.includes("bias")) {
      return '[sp_easyaccordion id="3738"]'; // Frequently Asked Questions About Workplace Discrimination in Visalia
    }
  }

  // Fresno specific
  if (kw.includes("fresno")) {
    if (kw.includes("meal") || kw.includes("rest break") || kw.includes("lunch") || kw.includes("break")) {
      return '[sp_easyaccordion id="4095"]'; // Fresno Meal and Rest Break Violations
    }
    if (kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid") || kw.includes("minimum wage")) {
      return '[sp_easyaccordion id="4086"]'; // Fresno Wage Theft Attorney
    }
    if (kw.includes("whistleblower") || kw.includes("retaliat")) {
      return '[sp_easyaccordion id="3646"]'; // What is whistleblower retaliation in Fresno, California?
    }
    if (kw.includes("overtime")) {
      return '[sp_easyaccordion id="3619"]'; // Fresno Overtime Violation lawyer
    }
    if (kw.includes("harass") || kw.includes("hostile")) {
      return '[sp_easyaccordion id="3446"]'; // Fresno Workplace Harassment Lawyer
    }
    if (kw.includes("lgbt") || kw.includes("queer") || kw.includes("trans")) {
      return '[sp_easyaccordion id="3239"]'; // LGBTQ Discrimination Attorney in Fresno, California
    }
  }

  // Bakersfield specific
  if (kw.includes("bakersfield")) {
    if (kw.includes("wage") || kw.includes("hour") || kw.includes("unpaid") || kw.includes("theft") || kw.includes("overtime")) {
      return '[sp_easyaccordion id="3405"]'; // Bakersfield Wage and Hour Violations Lawyer
    }
    if (kw.includes("lgbt") || kw.includes("queer") || kw.includes("trans")) {
      return '[sp_easyaccordion id="3312"]'; // LGBTQ Discrimination Bakersfield
    }
  }

  // Los Angeles specific
  if (kw.includes("los angeles")) {
    if (kw.includes("race") || kw.includes("ethnic") || kw.includes("national origin") || kw.includes("color")) {
      return '[sp_easyaccordion id="3549"]'; // Ethnic and National Origin Discrimination in Los Angeles
    }
  }

  // Burbank specific
  if (kw.includes("burbank")) {
    if (kw.includes("race") || kw.includes("racial") || kw.includes("ethnic") || kw.includes("national origin") || kw.includes("color")) {
      return '[sp_easyaccordion id="4355"]'; // Burbank Race Discrimination Attorney
    }
    if (kw.includes("hostile") || kw.includes("harassment") || kw.includes("environment")) {
      return '[sp_easyaccordion id="4200"]'; // Burbank Hostile Work Environment Lawyer
    }
    if (kw.includes("wrongful") || kw.includes("termination") || kw.includes("firing") || kw.includes("fired")) {
      return '[sp_easyaccordion id="4176"]'; // Burbank Wrongful Termination Lawyer
    }
    if (kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid") || kw.includes("pay") || kw.includes("overtime")) {
      return '[sp_easyaccordion id="4167"]'; // Burbank Wage Theft Attorney
    }
    if (kw.includes("disability") || kw.includes("medical condition") || kw.includes("accommodation")) {
      return '[sp_easyaccordion id="3894"]'; // Burbank Disability Discrimination Lawyer
    }
    if (kw.includes("gender") || kw.includes("sex") || kw.includes("women") || kw.includes("pregnancy")) {
      return '[sp_easyaccordion id="3877"]'; // Burbank Gender Discrimination Lawyer
    }
  }

  // General Topic Matching across all 45 live posts
  if (kw.includes("race") || kw.includes("racial") || kw.includes("color") || kw.includes("ethnic") || kw.includes("national origin") || kw.includes("ancestry")) {
    return '[sp_easyaccordion id="4355"]'; // Burbank Race Discrimination Attorney
  }
  if (kw.includes("hostile") || kw.includes("toxic") || kw.includes("work environment")) {
    return '[sp_easyaccordion id="4200"]'; // Burbank Hostile Work Environment Lawyer
  }
  if (kw.includes("meal") || kw.includes("rest break") || kw.includes("lunch") || kw.includes("break")) {
    return '[sp_easyaccordion id="4119"]'; // Visalia Meal and Rest Break Violations
  }
  if (kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid") || kw.includes("minimum wage") || kw.includes("off the clock")) {
    return '[sp_easyaccordion id="4167"]'; // Burbank Wage Theft Attorney
  }
  if (kw.includes("overtime")) {
    return '[sp_easyaccordion id="3719"]'; // overtime violations in Visalia
  }
  if (kw.includes("disability") || kw.includes("accommodation") || kw.includes("medical condition") || kw.includes("interactive process")) {
    return '[sp_easyaccordion id="3894"]'; // Burbank Disability Discrimination Lawyer
  }
  if (kw.includes("gender") || kw.includes("sex") || kw.includes("pregnancy") || kw.includes("pay equity")) {
    return '[sp_easyaccordion id="3877"]'; // Burbank Gender Discrimination Lawyer
  }
  if (kw.includes("maternity") || kw.includes("paternity")) {
    return '[sp_easyaccordion id="3356"]'; // Maternity Leave
  }
  if (kw.includes("sexual harassment") || kw.includes("quid pro quo")) {
    return '[sp_easyaccordion id="3464"]'; // San Pedro Sexual Harassment Lawyer
  }
  if (kw.includes("leave") || kw.includes("fmla") || kw.includes("cfra") || kw.includes("family")) {
    return '[sp_easyaccordion id="3788"]'; // Visalia Family and Medical Leave Lawyer
  }
  if (kw.includes("whistleblower")) {
    return '[sp_easyaccordion id="3646"]'; // What is whistleblower retaliation in Fresno, California?
  }
  if (kw.includes("retaliat")) {
    return '[sp_easyaccordion id="3740"]'; // What is workplace retaliation?
  }
  if (kw.includes("adverse")) {
    return '[sp_easyaccordion id="3932"]'; // What is an Adverse Employment Action?
  }
  if (kw.includes("evict") || kw.includes("landlord")) {
    return '[sp_easyaccordion id="3348"]'; // Landlord Eviction
  }
  if (kw.includes("tenant")) {
    return '[sp_easyaccordion id="3344"]'; // Tenant Harassment & Intimidation
  }
  if (kw.includes("sue") || kw.includes("on my own")) {
    return '[sp_easyaccordion id="3828"]'; // How Can I Sue My Employer on My Own in California?
  }
  if (kw.includes("wrongful") || kw.includes("termination") || kw.includes("firing") || kw.includes("fired")) {
    return '[sp_easyaccordion id="4176"]'; // Burbank Wrongful Termination Lawyer
  }

  // Fallback to Burbank Wrongful Termination
  return '[sp_easyaccordion id="4176"]';
}

/**
 * Builds the clean compensation section containing:
 * 1. Legal compensation explanation and employee rights
 * 2. Topic-specific CTA linking to phone (747) 888-0077 and consultation
 * 3. Native Easy Accordion shortcode [sp_easyaccordion id="..."]
 *
 * CRITICAL CLIENT REQUIREMENT:
 * Absolutely NO inline <style> CSS, NO <script> JavaScript, and NO JSON-LD schema
 * inside this ACF field.
 */
export function buildCompensationSection(
  compensationIntro: string,
  faqs: AtoyanFaq[] = [],
  city = "California",
  keyword = "Employment Law",
  accordionShortcode?: string,
): string {
  let shortcode = (accordionShortcode || "").trim();
  if (shortcode && !shortcode.startsWith("[")) {
    shortcode = `[sp_easyaccordion id="${shortcode}"]`;
  }

  if (!shortcode) {
    const match = compensationIntro.match(/\[sp_easyaccordion\s+id=["']?(\d+)["']?\]/i);
    if (match) {
      shortcode = match[0];
    } else {
      shortcode = resolveDefaultAccordionShortcode(keyword, city);
    }
  }

  const cleanIntro = compensationIntro
    .replace(/\[sp_easyaccordion\s+id=["']?\d+["']?\]/gi, "")
    .trim();

  return `${cleanIntro}\r\n\r\n${shortcode}`;
}

/**
 * Constructs the exact SCF / ACF `personal_injury_group` payload for WordPress REST API.
 */
export function buildAcfPersonalInjuryGroup(
  content: AtoyanLegalContent,
  bannerImageUrl: string,
  servicesImageUrl: string,
  servicesAttachmentId?: number,
  bannerAttachmentId?: number,
  baseGroup?: Partial<AcfPersonalInjuryGroup>,
): AcfPersonalInjuryGroup {
  const fullServicesContent = buildServicesContent(
    content.servicesContent,
    servicesImageUrl,
    content.heroTitle,
    servicesAttachmentId,
  );

  const fullCompensationContent = buildCompensationSection(
    content.compensationIntro,
    content.faqs,
    content.city,
    content.keyword,
    content.accordionShortcode,
  );

  return {
    personal_injury_image: bannerAttachmentId || ATOYAN_BANNER_ATTACHMENT_ID,
    personal_injury_title: content.heroTitle,
    _personal_injury_services_heading: content.servicesHeading,
    _personal_injury_services_sub_heading: content.servicesSubHeading,
    _personal_injury_services_content: fullServicesContent,
    _personal_injury_services_Sidebar:
      baseGroup?._personal_injury_services_Sidebar || ATOYAN_DEFAULT_SIDEBAR_IDS,
    testimonials_reviews_bg_image: ATOYAN_TESTIMONIALS_BG_ATTACHMENT_ID,
    testimonials_reviews_heading:
      baseGroup?.testimonials_reviews_heading || ATOYAN_TESTIMONIALS_HEADING,
    testimonials_reviews_sub_heading:
      baseGroup?.testimonials_reviews_sub_heading || ATOYAN_TESTIMONIALS_SUB_HEADING,
    testimonials_reviews_repet:
      baseGroup?.testimonials_reviews_repet || ATOYAN_TESTIMONIALS_REVIEWS,
    testimonials_reviews_button:
      baseGroup?.testimonials_reviews_button || ATOYAN_TESTIMONIALS_BUTTON,
    how_do_heading: content.howDoHeading,
    how_do_content: content.howDoContent,
    how_do_contact_form_heading:
      baseGroup?.how_do_contact_form_heading || ATOYAN_CONTACT_FORM_HEADING,
    how_do_contact_form_shortcode:
      baseGroup?.how_do_contact_form_shortcode || ATOYAN_CONTACT_FORM_SHORTCODE,
    cta_bg_image: ATOYAN_CTA_BG_ATTACHMENT_ID,
    cta_heading: baseGroup?.cta_heading || ATOYAN_CTA_HEADING,
    cta_content: baseGroup?.cta_content || ATOYAN_CTA_CONTENT,
    cta_button: baseGroup?.cta_button || ATOYAN_CTA_BUTTON,
    compensation_heading: content.compensationHeading,
    compensation_content: fullCompensationContent,
  };
}

/**
 * Dual-write postmeta dictionary for fallback persistence in case REST fields bypass ACF hooks.
 */
export function buildPostmetaDictionary(
  content: AtoyanLegalContent,
  bannerImageUrl: string,
  servicesImageUrl: string,
): Record<string, string> {
  return {
    _personal_injury_group: "field_678c8a98fc64a",
    personal_injury_group_personal_injury_image: bannerImageUrl,
    personal_injury_group_personal_injury_title: content.heroTitle,
    personal_injury_group__personal_injury_services_heading: content.servicesHeading,
    personal_injury_group__personal_injury_services_sub_heading: content.servicesSubHeading,
    personal_injury_group_how_do_heading: content.howDoHeading,
    personal_injury_group_how_do_content: content.howDoContent,
    personal_injury_group_compensation_heading: content.compensationHeading,
    _yoast_wpseo_title: content.yoastTitle,
    _yoast_wpseo_metadesc: content.yoastMetaDesc,
    _yoast_wpseo_focuskw: content.yoastFocusKw,
  };
}
