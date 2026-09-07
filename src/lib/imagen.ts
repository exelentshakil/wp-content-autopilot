import fs from "fs";
import path from "path";
import zlib from "zlib";
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
 * Creates a valid, lightweight binary PNG buffer in pure Node.js.
 * This guarantees WordPress REST media upload will never reject the fallback.
 */
function createSolidPngBuffer(width: number, height: number, r: number, g: number, b: number): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

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
    rawData[rowOffset] = 0; // filter type None
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

  // Pure binary PNG fallback in case disk read is unavailable
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
  // Method 1: Google Gemini Image generation models (gemini-2.5-flash-image)
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

  // Method 2: Google Imagen 3 predict endpoint
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
      size: "1024x1024",
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

  // Guaranteed fallback to authentic Atoyan Law Firm practice area photography
  return generateBrandedFallbackImage(opts);
}

/**
 * Generates both Atoyan practice area images:
 * 1. Banner Image (16:9): Moody legal desk with case files and warm banker's lamp.
 * 2. Services Image (4:3): Stylized editorial depiction of workplace conflict / corporate stress.
 */
export async function generateAtoyanImages(params: {
  keyword: string;
  city?: string;
  slug?: string;
  apiKey?: string;
  openaiKey?: string;
}): Promise<AtoyanImages> {
  const { keyword, city = "California", slug, apiKey, openaiKey } = params;
  const safeSlug = (slug || keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-|-$/g, "");

  const bannerPrompt = `High-end cinematic photography of a prestigious California law office desk at night. A warm glowing green banker's desk lamp illuminates stacked legal case files, court briefs, leather-bound California legal law books, and dark polished mahogany wood. Deep moody shadows, elegant bokeh, professional attorney firm aesthetic. 16:9 wide landscape orientation.`;

  const servicesPrompt = `Editorial stylized modern illustration depicting workplace rights and employee advocacy regarding ${keyword} in ${city}. An employee consulting legal documents with confident body language in a sleek corporate office environment. Stylized professional corporate editorial art, tasteful color palette with navy blue, warm amber, and slate tones. 4:3 landscape orientation.`;

  const [banner, services] = await Promise.all([
    generateSingleImage({
      prompt: bannerPrompt,
      filename: `${safeSlug}-banner.jpg`,
      altText: `${keyword} in ${city} - Atoyan Law Firm`,
      width: 1200,
      height: 675,
      apiKey,
      openaiKey,
    }),
    generateSingleImage({
      prompt: servicesPrompt,
      filename: `${safeSlug}-services.jpg`,
      altText: `${keyword} Legal Services & Representation - Atoyan Law`,
      width: 800,
      height: 600,
      apiKey,
      openaiKey,
    }),
  ]);

  return { banner, services };
}
