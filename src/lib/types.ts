import { z } from "zod";

/**
 * Everything here is "settings", not code. It is the whole product: the
 * formatting pipeline is rule-driven off this object, not a hardcoded prompt,
 * so a reviewer can change David's rules without touching a line of TypeScript.
 */
export const KeywordLink = z.object({
  keyword: z.string().min(1),
  url: z.string().min(1),
});
export type KeywordLink = z.infer<typeof KeywordLink>;

export const AcfMapping = z.object({
  title_field: z.string().default("post_title"),
  body_field: z.string().default("article_body"),
  cta_field: z.string().default("cta_block"),
  image1_field: z.string().default("hero_image"),
  image2_field: z.string().default("secondary_image"),
});
export type AcfMapping = z.infer<typeof AcfMapping>;

export const Settings = z.object({
  llm_provider: z.enum(["gemini", "openai", "simulator"]).default("simulator"),
  gemini_api_key: z.string().optional(),
  openai_api_key: z.string().optional(),
  system_prompt: z
    .string()
    .default(
      "You are David's trained content writer. Write a thorough, well-structured article for the given title. Use clear subheadings and a natural, informative tone.",
    ),
  heading_class: z.string().default("david"),
  cta_shortcode: z.string().default("[cta_signup]"),
  cta_after_paragraph: z.number().int().min(1).default(2),
  keyword_links: z.array(KeywordLink).default([{ keyword: "David", url: "/david/" }]),
  image_template: z.enum(["sunset", "midnight", "paper"]).default("sunset"),
  wp_site_url: z.string().optional(),
  wp_username: z.string().optional(),
  wp_app_password: z.string().optional(),
  acf_mapping: AcfMapping.default({
    title_field: "post_title",
    body_field: "article_body",
    cta_field: "cta_block",
    image1_field: "hero_image",
    image2_field: "secondary_image",
  }),
});
export type Settings = z.infer<typeof Settings>;

export const GenerateRequest = z.object({
  title: z.string().min(3),
  settings: Settings,
});

export const PublishRequest = z.object({
  title: z.string().min(3),
  formatted_body: z.string(),
  cta_block: z.string(),
  image_url: z.string(),
  schedule_at: z.string().optional(),
  settings: Settings,
});

export interface FormattedArticle {
  raw: string;
  formatted: string;
  headings_wrapped: number;
  links_inserted: number;
  cta_inserted: boolean;
  dashes_stripped: number;
  html_stripped: boolean;
}
