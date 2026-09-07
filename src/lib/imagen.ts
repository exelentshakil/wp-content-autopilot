import * as opentype from "opentype.js";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import sharp from "sharp";
import type { AtoyanGeneratedImage, AtoyanImages } from "./types";

interface GenerateSingleImageOptions {
  prompt: string;
  filename: string;
  altText: string;
  width: number;
  height: number;
  apiKey?: string;
  openaiKey?: string;
}

/**
 * Derives the core practice area category from a keyword/city string.
 * Example: 'Burbank Wrongful Termination Lawyer' -> 'WRONGFUL TERMINATION'
 */
export function deriveAtoyanCategory(keyword: string, city?: string): string {
  let cleaned = keyword;
  if (city) {
    cleaned = cleaned.replace(new RegExp(city, "gi"), "");
  }
  cleaned = cleaned.replace(/\b(lawyer|attorney|law firm|attorneys|lawyers|legal representation|legal advocacy)\b/gi, "");
  cleaned = cleaned.trim().replace(/^[-–—:,\s]+|[-–—:,\s]+$/g, "");
  if (!cleaned || cleaned.length < 3) {
    return "CALIFORNIA EMPLOYMENT LAW";
  }
  return cleaned;
}

/**
 * Composites the official Atoyan Law Firm 'A' logo and dark gradient on the left side
 * of the 1920x451 banner image to match authentic live site banners (e.g. Burbank-Wrongful-Termination-Lawyer-bar.jpg).
 */

let cachedFont: opentype.Font | null = null;

function getAtoyanFont(): opentype.Font | null {
  if (cachedFont) return cachedFont;
  try {
    const fontPath = path.join(process.cwd(), "public/fonts/bold.ttf");
    if (fs.existsSync(fontPath)) {
      const buffer = fs.readFileSync(fontPath);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      cachedFont = opentype.parse(arrayBuffer);
      return cachedFont;
    }
  } catch (err) {
    console.warn("Could not load public/fonts/bold.ttf:", err);
  }
  return null;
}

export function renderTextAsSvgPath(
  font: opentype.Font,
  text: string,
  x: number,
  y: number,
  maxFontSize: number,
  maxWidth: number
): { pathData: string; fontSize: number } {
  let fontSize = maxFontSize;
  let width = font.getAdvanceWidth(text, fontSize);
  if (width > maxWidth) {
    fontSize = Math.max(12, Math.floor((fontSize * maxWidth) / width));
  }
  const p = font.getPath(text, x, y, fontSize);
  return { pathData: p.toPathData(2), fontSize };
}

export async function compositeAtoyanBanner(
  imageBuffer: Buffer
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const width = 1920;
  const height = 451;

  let logoB64 = "";
  try {
    const logoPath = path.join(process.cwd(), "public/images/atoyan-logo-icon.png");
    if (fs.existsSync(logoPath)) {
      logoB64 = fs.readFileSync(logoPath).toString("base64");
    }
  } catch (err) {
    console.warn("Could not read atoyan-logo-icon.png:", err);
  }

  const logoElement = logoB64
    ? `<g opacity="0.45" transform="translate(-25, 0)">
        <image xlink:href="data:image/png;base64,${logoB64}" x="0" y="0" width="451" height="451" preserveAspectRatio="none" />
      </g>`
    : "";

  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="warmGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#9c6941" stop-opacity="0.95"/>
          <stop offset="20%" stop-color="#8a5732" stop-opacity="0.88"/>
          <stop offset="38%" stop-color="#6e4222" stop-opacity="0.65"/>
          <stop offset="52%" stop-color="#482711" stop-opacity="0.35"/>
          <stop offset="65%" stop-color="#18120b" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${Math.round(width * 0.65)}" height="${height}" fill="url(#warmGrad)" />
      ${logoElement}
    </svg>
  `);

  const brandedBuffer = await sharp(imageBuffer)
    .resize(width, height, { fit: "cover" })
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return { buffer: brandedBuffer, width, height };
}

/**
 * Composites the official Atoyan Law Firm dark horizontal banner bar and typography
 * across the top of the 600x400 services image:
 * Line 1 (White #FFFFFF, ~20px bold): Main Practice Area / Keyword (e.g. BURBANK WRONGFUL TERMINATION LAWYER)
 * Line 2 (Yellow/Gold #E5C345, ~17px bold): Practice category / sub-topic (e.g. WRONGFUL TERMINATION)
 */
export async function compositeAtoyanServicesImage(
  imageBuffer: Buffer,
  params: { headline: string; category: string }
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const width = 600;
  const height = 400;
  const barTop = 26;
  const barHeight = 70;

  const escapeXml = (str: string) =>
    str.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });

  const rawHeadline = params.headline.toUpperCase();
  const rawCategory = params.category.toUpperCase();

  const font = getAtoyanFont();
  let textMarkup = "";

  if (font) {
    // Vector path glyph rendering - eliminates tofu glyphs [][][] entirely on Vercel
    const line1 = renderTextAsSvgPath(font, rawHeadline, 16, barTop + 28, 20, 568);
    const line2 = renderTextAsSvgPath(font, rawCategory, 16, barTop + 54, 16, 568);
    textMarkup = `
      <path d="${line1.pathData}" fill="#FFFFFF" filter="url(#shadow)" />
      <path d="${line2.pathData}" fill="#E5C345" filter="url(#shadow)" />
    `;
  } else {
    // Safe SVG text fallback
    const headline = escapeXml(rawHeadline);
    const category = escapeXml(rawCategory);
    const hLen = headline.length;
    const line1FontSize = hLen > 36 ? Math.max(14, Math.floor(580 / (hLen * 0.65))) : 20;
    const line2FontSize = category.length > 38 ? Math.max(13, Math.floor(580 / (category.length * 0.65))) : 16;
    textMarkup = `
      <text x="16" y="${barTop + 28}" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${line1FontSize}" font-weight="900" letter-spacing="0.5" filter="url(#shadow)">${headline}</text>
      <text x="16" y="${barTop + 54}" fill="#E5C345" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${line2FontSize}" font-weight="900" letter-spacing="0.5" filter="url(#shadow)">${category}</text>
    `;
  }

  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
      </defs>
      <rect x="0" y="${barTop}" width="${width}" height="${barHeight}" fill="rgba(20, 20, 20, 0.72)" />
      ${textMarkup}
    </svg>
  `);

  const brandedBuffer = await sharp(imageBuffer)
    .resize(width, height, { fit: "cover" })
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return { buffer: brandedBuffer, width, height };
}

/**
 * Creates a valid, lightweight binary PNG buffer in pure Node.js.
 * This guarantees WordPress REST media upload will never reject the fallback.
 */
function createSolidPngBuffer(width: number, height: number, r: number, g: number, b: number): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, "ascii");
    data.copy(buf, 8);
    const crc = zlib.crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const rowLen = 1 + width * 3;
  const rawData = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Deterministic branded fallback image: serves authentic high-resolution Atoyan Law Firm
 * practice area photography from local disk so previews never render as an empty blank box.
 */
function generateBrandedFallbackImage(opts: GenerateSingleImageOptions): AtoyanGeneratedImage {
  try {
    const isBanner = opts.width >= 1000;
    const relFile = isBanner
      ? "public/images/atoyan-banner-default.jpg"
      : "public/images/atoyan-services-default.jpg";
    const absPath = path.join(process.cwd(), relFile);

    if (fs.existsSync(absPath)) {
      const b64 = fs.readFileSync(absPath).toString("base64");
      return {
        base64: b64,
        mimeType: "image/jpeg",
        prompt: opts.prompt,
        filename: opts.filename.replace(/\.png$/, ".jpg"),
        altText: opts.altText,
        width: opts.width,
        height: opts.height,
      };
    }
  } catch (err) {
    console.warn("Fallback disk image read warning:", err);
  }

  const pngBuffer = createSolidPngBuffer(opts.width, opts.height, 15, 23, 42);
  const base64 = pngBuffer.toString("base64");

  return {
    base64,
    mimeType: "image/png",
    prompt: opts.prompt,
    filename: opts.filename.replace(/\.jpe?g$/, ".png"),
    altText: opts.altText,
    width: opts.width,
    height: opts.height,
  };
}

/**
 * Generates an image using Google Generative Language API.
 * Supports gemini-2.5-flash-image / gemini-3.1-flash-image (generateContent) and Imagen 3 (:predict).
 */
async function tryGeminiImagen(opts: GenerateSingleImageOptions, key: string): Promise<AtoyanGeneratedImage | null> {
  const models = ["gemini-2.5-flash-image", "gemini-3.1-flash-image"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: opts.prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE"],
          },
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (res.ok) {
        const json = await res.json();
        const inlineData = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          return {
            base64: inlineData.data,
            mimeType: inlineData.mimeType || "image/png",
            prompt: opts.prompt,
            filename: opts.filename.replace(/\.jpe?g$/, ".png"),
            altText: opts.altText,
            width: opts.width,
            height: opts.height,
          };
        }
      }
    } catch {
      // Continue to next model or predict endpoint
    }
  }

  try {
    const ratio = opts.width / opts.height;
    const aspectRatio = Math.abs(ratio - 16 / 9) < Math.abs(ratio - 4 / 3) ? "16:9" : "4:3";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: opts.prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio,
          outputOptions: { mimeType: "image/jpeg" },
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (res.ok) {
      const json = await res.json();
      const prediction = json.predictions?.[0];
      const b64 = prediction?.bytesBase64Encoded;

      if (b64) {
        return {
          base64: b64,
          mimeType: prediction.mimeType || "image/jpeg",
          prompt: opts.prompt,
          filename: opts.filename,
          altText: opts.altText,
          width: opts.width,
          height: opts.height,
        };
      }
    }
  } catch (err) {
    console.warn("Imagen 3 predict attempt warning:", err);
  }

  return null;
}

/**
 * Tries OpenAI DALL-E 3 image generation if OpenAI key is available.
 */
async function tryOpenAiImage(opts: GenerateSingleImageOptions, key: string): Promise<AtoyanGeneratedImage | null> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: opts.prompt,
      n: 1,
      size: opts.width >= opts.height ? "1792x1024" : "1024x1024",
      response_format: "b64_json",
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`DALL-E 3 request returned ${res.status}: ${errText.slice(0, 200)}`);
    return null;
  }

  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (b64) {
    return {
      base64: b64,
      mimeType: "image/png",
      prompt: opts.prompt,
      filename: opts.filename.replace(/\.jpe?g$/, ".png"),
      altText: opts.altText,
      width: opts.width,
      height: opts.height,
    };
  }

  return null;
}

/**
 * Generates an image using available AI providers, falling back gracefully to authentic Atoyan photography.
 */
async function generateSingleImage(opts: GenerateSingleImageOptions): Promise<AtoyanGeneratedImage> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || opts.apiKey?.trim() || undefined;
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || opts.openaiKey?.trim() || undefined;

  if (geminiKey) {
    try {
      const geminiImg = await tryGeminiImagen(opts, geminiKey);
      if (geminiImg) return geminiImg;
    } catch (e) {
      console.warn("Gemini image generation attempt failed:", e);
    }
  }

  if (openaiKey) {
    try {
      const openaiImg = await tryOpenAiImage(opts, openaiKey);
      if (openaiImg) return openaiImg;
    } catch (e) {
      console.warn("OpenAI image generation attempt failed:", e);
    }
  }

  return generateBrandedFallbackImage(opts);
}

/**
 * Generates both Atoyan practice area images:
 * 1. Banner Image (1920x451): Moody legal desk with Atoyan 'A' brand mark & dark left gradient.
 * 2. Services Image (600x400): Editorial corporate photo with dark horizontal overlay & bold typography.
 */
export async function generateAtoyanImages(params: {
  keyword: string;
  city?: string;
  category?: string;
  slug?: string;
  apiKey?: string;
  openaiKey?: string;
}): Promise<AtoyanImages> {
  const { keyword, city = "California", category: providedCategory, slug, apiKey, openaiKey } = params;
  const safeSlug = (slug || keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-|-$/g, "");
  const category = providedCategory || deriveAtoyanCategory(keyword, city);

  const bannerPrompt = `Cinematic professional 35mm photography of an empty California law firm partner office desk. Warm green banker desk lamp, stacked legal case files, leather-bound legal volumes on dark polished mahogany wood. Moody evening ambiance, soft bokeh, executive attorney aesthetic. STRICT NEGATIVE CONSTRAINT: Absolutely NO text, NO typography, NO letters, NO words, NO signs, NO watermark. 16:9 wide landscape orientation.`;

  const servicesPrompt = `Professional editorial corporate photograph of two legal professionals in business attire reviewing employment documents together in a sleek modern conference room. Natural light, clean architectural background, elegant navy and slate tones. STRICT NEGATIVE CONSTRAINT: Absolutely NO text, NO typography, NO letters, NO words, NO signage, NO overlays, NO watermarks. 3:2 landscape orientation (600x400).`;

  const [rawBanner, rawServices] = await Promise.all([
    generateSingleImage({
      prompt: bannerPrompt,
      filename: `${safeSlug}-banner.jpg`,
      altText: `${keyword} in ${city} - Atoyan Law Firm`,
      width: 1920,
      height: 451,
      apiKey,
      openaiKey,
    }),
    generateSingleImage({
      prompt: servicesPrompt,
      filename: `${safeSlug}-services.jpg`,
      altText: `${keyword} Legal Services & Representation - Atoyan Law`,
      width: 600,
      height: 400,
      apiKey,
      openaiKey,
    }),
  ]);

  // Apply Atoyan Law Firm Branding Composites
  let banner = rawBanner;
  try {
    const rawBannerBuf = Buffer.from(rawBanner.base64, "base64");
    const { buffer: bannerBuf, width: bW, height: bH } = await compositeAtoyanBanner(rawBannerBuf);
    banner = {
      ...rawBanner,
      base64: bannerBuf.toString("base64"),
      mimeType: "image/jpeg",
      width: bW,
      height: bH,
    };
  } catch (bannerErr) {
    console.warn("Banner branding composite warning:", bannerErr);
  }

  let services = rawServices;
  try {
    const rawServicesBuf = Buffer.from(rawServices.base64, "base64");
    const { buffer: servicesBuf, width: sW, height: sH } = await compositeAtoyanServicesImage(rawServicesBuf, {
      headline: keyword,
      category,
    });
    services = {
      ...rawServices,
      base64: servicesBuf.toString("base64"),
      mimeType: "image/jpeg",
      width: sW,
      height: sH,
    };
  } catch (servicesErr) {
    console.warn("Services branding composite warning:", servicesErr);
  }

  return { banner, services };
}
