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

export const ATOYAN_PHONE = "(888) 807-0077";
export const ATOYAN_PHONE_LINK = "tel:8888070077";
export const ATOYAN_CONTACT_URL = "/contact/";

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
export function generateEasyAccordionHtml(faqs: AtoyanFaq[], shortcodeId = 3932): string {
  if (!faqs || faqs.length === 0) {
    return `[sp_easyaccordion id="${shortcodeId}"]`;
  }

  const itemsHtml = faqs
    .map((faq, index) => {
      const isFirst = index === 0;
      const collapseId = `ea-collapse-${index + 1}`;
      const headingId = `ea-heading-${index + 1}`;
      const cleanQuestion = faq.question.trim().toUpperCase();
      const cleanAnswer = faq.answer.trim();

      return `
    <div class="ea-card ${isFirst ? "ea-expand" : ""} sp-ea-single" style="margin-bottom: 10px; border: 1px solid #e2e2e2; background: #eee; border-radius: 0; overflow: hidden;">
      <h3 class="ea-header" id="${headingId}" style="margin: 0; padding: 0; font-size: 15px; font-weight: 700; line-height: 1.4;">
        <a class="${isFirst ? "" : "collapsed"}" role="button" tabindex="0" aria-expanded="${isFirst ? "true" : "false"}" aria-controls="${collapseId}" style="display: flex; align-items: center; padding: 14px 18px; color: #444; text-decoration: none; font-weight: 700; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px; cursor: pointer; user-select: none;">
          <span class="ea-expand-icon" style="float: left; margin-right: 12px; font-size: 18px; font-weight: 700; line-height: 1; color: #444; min-width: 14px; text-align: center;">${isFirst ? "−" : "+"}</span>
          <span class="ea-header-text" style="color: #444;">${cleanQuestion}</span>
        </a>
      </h3>
      <div id="${collapseId}" class="sp-collapse spcollapse ${isFirst ? "show" : "collapsed"}" aria-labelledby="${headingId}" style="display: ${isFirst ? "block" : "none"}; background: #fff; border-top: 1px solid #e2e2e2;">
        <div class="ea-body" style="padding: 18px 22px; font-size: 15px; line-height: 1.7; color: #444; background: #fff;">
          <p dir="auto" style="margin: 0; color: #444;">${cleanAnswer}</p>
        </div>
      </div>
    </div>`;
    })
    .join("\n");

  const scopedCss = `
<style id="atoyan-easy-accordion-custom-style">
  .atoyan-faq-section .sp-ea-single {
    margin-bottom: 10px !important;
    border: 1px solid #e2e2e2 !important;
    background: #eee !important;
    transition: background 0.15s ease-in-out;
  }
  .atoyan-faq-section .sp-ea-single:hover {
    background: #e6e6e6 !important;
  }
  .atoyan-faq-section .ea-header a {
    color: #444 !important;
    text-decoration: none !important;
  }
  .atoyan-faq-section .ea-header a:hover {
    color: #000 !important;
  }
  .atoyan-faq-section .ea-expand-icon {
    font-family: Arial, sans-serif !important;
    font-weight: 700 !important;
  }
</style>`;

  const toggleScript = `
<script>
(function() {
  function initAtoyanAccordion() {
    var cards = document.querySelectorAll('.sp-ea-single');
    cards.forEach(function(card) {
      var link = card.querySelector('.ea-header a');
      var body = card.querySelector('.sp-collapse');
      var icon = card.querySelector('.ea-expand-icon');
      if (!link || !body || link.dataset.eaBound === 'true') return;
      link.dataset.eaBound = 'true';

      function toggle() {
        var isOpen = body.style.display === 'block' || body.classList.contains('show');
        if (isOpen) {
          body.style.display = 'none';
          body.classList.remove('show');
          body.classList.add('collapsed');
          link.classList.add('collapsed');
          link.setAttribute('aria-expanded', 'false');
          card.classList.remove('ea-expand');
          if (icon) icon.textContent = '+';
        } else {
          body.style.display = 'block';
          body.classList.add('show');
          body.classList.remove('collapsed');
          link.classList.remove('collapsed');
          link.setAttribute('aria-expanded', 'true');
          card.classList.add('ea-expand');
          if (icon) icon.textContent = '−';
        }
      }

      link.addEventListener('click', function(e) {
        e.preventDefault();
        toggle();
      });

      link.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAtoyanAccordion);
  } else {
    initAtoyanAccordion();
  }
  window.addEventListener('load', initAtoyanAccordion);
  setTimeout(initAtoyanAccordion, 300);
  setTimeout(initAtoyanAccordion, 1000);
})();
</script>`;

  const containerHtml = `
<div class="sp-easy-accordion-wrapper atoyan-faq-section" style="margin-top: 35px; margin-bottom: 30px;">
  ${scopedCss}
  <h3 class="h3dav" style="margin-bottom: 20px;">Frequently Asked Questions</h3>
  <div class="sp-ea-one sp-easy-accordion" data-ea-active="ea-click" data-ea-mode="vertical">
    ${itemsHtml}
  </div>
  ${toggleScript}
</div>`;

  return containerHtml;
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
 * Builds the complete dynamic compensation section containing:
 * 1. Legal compensation explanation
 * 2. Signature callout box
 * 3. Easy Accordion HTML & shortcode
 * 4. Schema.org FAQPage JSON-LD
 */
export function buildCompensationSection(
  compensationIntro: string,
  faqs: AtoyanFaq[],
  city = "California",
): string {
  const callout1 = formatCalloutBox(
    `Toxic workplace, retaliation, or wrongful termination in ${city}? That's not just unfair - it's illegal. Atoyan Law Firm is ready to fight for you.`,
    "Contact our employment lawyers today",
  );

  const accordionHtml = generateEasyAccordionHtml(faqs);

  const schemaJsonLd = generateFaqSchemaJsonLd(faqs);

  return `${compensationIntro.trim()}\r\n\r\n${callout1}\r\n\r\n${accordionHtml}\r\n\r\n${schemaJsonLd}`;
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
