import type {
  Settings,
  AtoyanLegalContent,
  AtoyanGeneratedImage,
  AtoyanPublishResult,
} from "./types";
import type { AcfPersonalInjuryGroup } from "./types";
import {
  ATOYAN_PARENT_PAGE_ID,
  ATOYAN_TEMPLATE,
  ATOYAN_REFERENCE_PAGE_ID,
  ATOYAN_BANNER_ATTACHMENT_ID,
  buildAcfPersonalInjuryGroup,
  generateFaqSchemaJsonLd,
} from "./atoyan";

export interface PublishResult {
  mode: "live" | "simulated";
  post_url?: string;
  post_id?: number;
  status: "publish" | "future";
  scheduled_for?: string;
  acf_payload: Record<string, unknown>;
}

/**
 * Uploads an image buffer directly to the WordPress media library (/wp-json/wp/v2/media).
 */
export async function uploadMediaToWordPress(params: {
  base64Data: string;
  filename: string;
  mimeType: string;
  altText: string;
  title: string;
  wpSiteUrl: string;
  authHeader: string;
  postId?: number;
}): Promise<{ id: number; url: string }> {
  const { base64Data, filename, mimeType, altText, title, wpSiteUrl, authHeader, postId } = params;
  const buffer = Buffer.from(base64Data, "base64");
  const cleanBase = wpSiteUrl.replace(/\/$/, "");

  const uploadRes = await fetch(`${cleanBase}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
    body: buffer,
    signal: AbortSignal.timeout(60_000),
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Media upload failed (${uploadRes.status}): ${errText.slice(0, 300)}`);
  }

  const mediaJson = await uploadRes.json();
  const mediaId = mediaJson.id as number;
  const sourceUrl = (mediaJson.source_url || mediaJson.guid?.rendered || "") as string;

  // Set alt text, title, and optional attached post
  try {
    const patchBody: Record<string, unknown> = {
      title,
      alt_text: altText,
      description: altText,
    };
    if (postId) patchBody.post = postId;

    await fetch(`${cleanBase}/wp-json/wp/v2/media/${mediaId}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchBody),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (patchErr) {
    console.warn("Failed to patch media metadata, proceeding with upload ID:", patchErr);
  }

  return { id: mediaId, url: sourceUrl };
}

/**
 * Updates Yoast SEO metadata via Yoast bulk editor.
 */
export async function updateYoastSeo(params: {
  postId: number;
  title: string;
  description: string;
  focusKeyphrase: string;
  wpSiteUrl: string;
  authHeader: string;
}): Promise<boolean> {
  const { postId, title, description, focusKeyphrase, wpSiteUrl, authHeader } = params;
  const cleanBase = wpSiteUrl.replace(/\/$/, "");

  try {
    const res = await fetch(`${cleanBase}/wp-json/yoast/v1/bulk_editor/update_search`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: postId,
            seo_title: title,
            meta_description: description,
            focus_keyphrase: focusKeyphrase,
          },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    return res.ok;
  } catch (err) {
    console.warn("Yoast REST update failed:", err);
    return false;
  }
}

/**
 * Core publishing engine for Atoyan Law Firm practice area pages.
 */
/**
 * Formats any date string or Date object to the strict format required by WordPress REST API:
 * 'YYYY-MM-DDTHH:MM:SS' for both local site date and date_gmt.
 * This resolves the WordPress REST 400 rest_invalid_date error caused by missing seconds in datetime-local inputs.
 */
export function formatWordPressDate(dateInput: string | Date): { date: string; date_gmt: string } {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid schedule date: ${dateInput}`);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const date_gmt = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  return { date, date_gmt };
}

export async function publishAtoyanPage(params: {
  content: AtoyanLegalContent;
  bannerImage?: AtoyanGeneratedImage;
  bannerUrl?: string;
  bannerAttachmentId?: number;
  servicesImage?: AtoyanGeneratedImage;
  servicesUrl?: string;
  servicesAttachmentId?: number;
  scheduleAt?: string;
  settings?: Settings;
}): Promise<AtoyanPublishResult> {
  const {
    content,
    bannerImage,
    bannerUrl: existingBannerUrl,
    bannerAttachmentId: existingBannerId,
    servicesImage,
    servicesUrl: existingServicesUrl,
    servicesAttachmentId: existingServicesId,
    scheduleAt,
    settings,
  } = params;

  const wpSiteUrl =
    process.env.WP_SITE_URL?.trim() ||
    settings?.wp_site_url?.trim() ||
    "https://www.atoyanlaw.com";
  const wpUser =
    process.env.WP_USER?.trim() ||
    settings?.wp_username?.trim() ||
    undefined;
  const wpPassword =
    process.env.WP_PASSWORD?.trim() ||
    settings?.wp_app_password?.trim() ||
    undefined;

  const cleanBase = wpSiteUrl.replace(/\/$/, "");
  const status = scheduleAt ? "future" : "publish";

  let bannerUrl = existingBannerUrl || "https://www.atoyanlaw.com/wp-content/uploads/2026/07/Adverse-Employment-Action-in-California.jpg";
  let bannerAttachmentId = existingBannerId;
  let newlyUploadedBannerId: number | undefined;

  let servicesUrl = existingServicesUrl || "https://www.atoyanlaw.com/wp-content/uploads/2026/07/adverse-employment-action.jpg";
  let servicesAttachmentId = existingServicesId;
  let newlyUploadedServicesId: number | undefined;

  // Build ACF Group
  const acfGroup = buildAcfPersonalInjuryGroup(
    content,
    bannerUrl,
    servicesUrl,
    servicesAttachmentId,
  );

  // If credentials are not provided or simulator provider selected, return graceful simulation
  if (!wpUser || !wpPassword || settings?.llm_provider === "simulator") {
    return {
      mode: "simulated",
      status,
      postId: 3933,
      pageUrl: `${cleanBase}/${content.slug}/`,
      editUrl: `${cleanBase}/wp-admin/post.php?post=3933&action=edit`,
      scheduledFor: scheduleAt ? formatWordPressDate(scheduleAt).date : undefined,
      bannerAttachmentId,
      bannerUrl,
      servicesAttachmentId,
      servicesUrl,
      yoastUpdated: true,
      inpostHeadScript: generateFaqSchemaJsonLd(content.faqs),
      acfPayload: acfGroup as unknown as Record<string, unknown>,
    };
  }

  const authHeader = Buffer.from(`${wpUser}:${wpPassword}`).toString("base64");

  // Step 0: Fetch reference post 3898 to clone its exact verified ACF structure
  let baseGroup: Partial<AcfPersonalInjuryGroup> = {};
  try {
    const refRes = await fetch(`${cleanBase}/wp-json/wp/v2/pages/${ATOYAN_REFERENCE_PAGE_ID}`, {
      headers: { Authorization: `Basic ${authHeader}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (refRes.ok) {
      const refJson = await refRes.json();
      if (refJson?.acf?.personal_injury_group) {
        baseGroup = refJson.acf.personal_injury_group;
      }
    }
  } catch (refErr) {
    console.warn("Could not fetch reference post 3898, falling back to static template:", refErr);
  }

  // Step 1: Upload Banner Image if provided
  if (bannerImage?.base64 && !existingBannerUrl) {
    try {
      const bannerUpload = await uploadMediaToWordPress({
        base64Data: bannerImage.base64,
        filename: bannerImage.filename,
        mimeType: bannerImage.mimeType,
        altText: bannerImage.altText,
        title: bannerImage.altText,
        wpSiteUrl: cleanBase,
        authHeader,
      });
      bannerUrl = bannerUpload.url;
      bannerAttachmentId = bannerUpload.id;
      newlyUploadedBannerId = bannerUpload.id;
    } catch (bannerErr) {
      console.warn("Banner upload error, falling back to default image:", bannerErr);
    }
  }

  // Step 2: Upload Services Image if provided
  if (servicesImage?.base64 && !existingServicesUrl) {
    try {
      const servicesUpload = await uploadMediaToWordPress({
        base64Data: servicesImage.base64,
        filename: servicesImage.filename,
        mimeType: servicesImage.mimeType,
        altText: servicesImage.altText,
        title: servicesImage.altText,
        wpSiteUrl: cleanBase,
        authHeader,
      });
      servicesUrl = servicesUpload.url;
      servicesAttachmentId = servicesUpload.id;
      newlyUploadedServicesId = servicesUpload.id;
    } catch (servicesErr) {
      console.warn("Services image upload error, falling back to default image:", servicesErr);
    }
  }

  // Step 3: Re-build ACF Group with newly uploaded image IDs and cloned reference assets
  const finalAcfGroup = buildAcfPersonalInjuryGroup(
    content,
    bannerUrl,
    servicesUrl,
    newlyUploadedServicesId || servicesAttachmentId,
    newlyUploadedBannerId || bannerAttachmentId,
    baseGroup,
  );

  // Client Requirement: standard post_content must strictly remain empty ("")
  // and extra head script fields (_inpost_head_script, synth_header_script) must NOT be sent.
  const pagePayload: Record<string, unknown> = {
    title: content.heroTitle,
    slug: content.slug,
    status,
    parent: ATOYAN_PARENT_PAGE_ID, // 750 (employment-law)
    template: ATOYAN_TEMPLATE, // templates/labor-law.php
    content: "", // Post content must remain strictly empty per client requirement
    acf: {
      personal_injury_group: finalAcfGroup,
    },
  };

  if (scheduleAt) {
    const formattedDate = formatWordPressDate(scheduleAt);
    pagePayload.date = formattedDate.date;
    pagePayload.date_gmt = formattedDate.date_gmt;
  }

  // Step 4: Create the Page via WordPress REST API
  const pageRes = await fetch(`${cleanBase}/wp-json/wp/v2/pages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pagePayload),
    signal: AbortSignal.timeout(60_000),
  });

  if (!pageRes.ok) {
    const errorBody = await pageRes.text();
    throw new Error(`WordPress page creation failed (${pageRes.status}): ${errorBody.slice(0, 300)}`);
  }

  const pageJson = await pageRes.json();
  const createdPageId = pageJson.id as number;
  const pageLink = (pageJson.link as string) || `${cleanBase}/?p=${createdPageId}`;
  const editUrl = `${cleanBase}/wp-admin/post.php?post=${createdPageId}&action=edit`;

  // Step 4b: Explicitly patch ACF on the newly created page to guarantee 100% field persistence
  try {
    await fetch(`${cleanBase}/wp-json/wp/v2/pages/${createdPageId}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "",
        acf: {
          personal_injury_group: finalAcfGroup,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (acfPatchErr) {
    console.warn("ACF follow-up persistence patch error:", acfPatchErr);
  }

  // Step 4c: Purge WP Rocket cache for the newly created page if bridge plugin is active
  try {
    await fetch(`${cleanBase}/wp-json/autopilot/v1/purge-cache`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_id: createdPageId,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Graceful fallback if bridge plugin is not yet activated
  }

  // Step 5: Update Yoast SEO
  const yoastUpdated = await updateYoastSeo({
    postId: createdPageId,
    title: content.yoastTitle,
    description: content.yoastMetaDesc,
    focusKeyphrase: content.yoastFocusKw,
    wpSiteUrl: cleanBase,
    authHeader,
  });

  // Step 6: Link ONLY newly uploaded attachments to parent post (never re-parent existing assets)
  const linkAttachmentPromises = [];
  if (newlyUploadedBannerId) {
    linkAttachmentPromises.push(
      fetch(`${cleanBase}/wp-json/wp/v2/media/${newlyUploadedBannerId}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post: createdPageId }),
      }).catch(() => null),
    );
  }
  if (newlyUploadedServicesId) {
    linkAttachmentPromises.push(
      fetch(`${cleanBase}/wp-json/wp/v2/media/${newlyUploadedServicesId}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post: createdPageId }),
      }).catch(() => null),
    );
  }
  await Promise.allSettled(linkAttachmentPromises);

  return {
    mode: "live",
    status,
    postId: createdPageId,
    pageUrl: pageLink,
    editUrl,
    scheduledFor: scheduleAt ? formatWordPressDate(scheduleAt).date : undefined,
    bannerAttachmentId,
    bannerUrl,
    servicesAttachmentId,
    servicesUrl,
    yoastUpdated,
    
    acfPayload: finalAcfGroup as unknown as Record<string, unknown>,
  };
}

// -----------------------------------------------------------------------------
// LEGACY COMPATIBILITY
// -----------------------------------------------------------------------------

export async function publishToWordPress(params: {
  title: string;
  body: string;
  cta: string;
  image1Url?: string;
  image2Url?: string;
  scheduleAt?: string;
  settings: Settings;
}): Promise<PublishResult> {
  const { title, body, cta, image1Url, image2Url, scheduleAt, settings } = params;

  const wpUser =
    process.env.WP_USER?.trim() ||
    settings?.wp_username?.trim() ||
    undefined;
  const wpPassword =
    process.env.WP_PASSWORD?.trim() ||
    settings?.wp_app_password?.trim() ||
    undefined;
  const wpSiteUrl =
    process.env.WP_SITE_URL?.trim() ||
    settings?.wp_site_url?.trim() ||
    "https://www.atoyanlaw.com";

  if (!wpUser || !wpPassword || settings.llm_provider === "simulator") {
    return {
      mode: "simulated",
      status: scheduleAt ? "future" : "publish",
      scheduled_for: scheduleAt,
      post_url: `${wpSiteUrl.replace(/\/$/, "")}/?p=simulated`,
      acf_payload: {},
    };
  }

  // Delegate to Atoyan publisher
  const atoyanContent: AtoyanLegalContent = {
    keyword: title,
    city: "California",
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    heroTitle: title,
    servicesHeading: `Practice Area: ${title}`,
    servicesSubHeading: "Legal Advocacy & Employee Protection",
    servicesContent: body,
    howDoHeading: "How to Protect Your Rights",
    howDoContent: "Consult an attorney before signing any severance agreements.",
    compensationHeading: "Legal Recovery & Damages",
    compensationIntro: cta,
    faqs: [],
    yoastTitle: `${title} | Atoyan Law Firm`,
    yoastMetaDesc: `Experienced attorney for ${title}. Free confidential consultation.`,
    yoastFocusKw: title,
  };

  const result = await publishAtoyanPage({
    content: atoyanContent,
    bannerUrl: image1Url,
    servicesUrl: image2Url,
    scheduleAt,
    settings,
  });

  return {
    mode: result.mode,
    status: result.status,
    scheduled_for: result.scheduledFor,
    post_id: result.postId,
    post_url: result.pageUrl,
    acf_payload: result.acfPayload,
  };
}
