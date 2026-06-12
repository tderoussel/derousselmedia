// Content collections schema for DeRoussel Media portfolio.
// Each gallery collection (sports, landscape, misc) has one markdown file per photo.
// The `films` collection has one file per video.
// The `pages` collection holds standalone editable pages (about, settings).

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Aspect / layout hint Alex can optionally set per photo.
// The Gallery component uses this to choose a grid cell size.
// `auto` (default) lets the editorial-mosaic algorithm decide based on
// position in the list and the image's intrinsic aspect ratio.
const SpanHint = z.enum(['auto', 'small', 'medium', 'large', 'wide', 'tall']).default('auto');

// Reusable photo schema. Used by sports/, landscape/, misc/.
// `image` is a path string (e.g. "/uploads/photo.jpg" or "/assets/sports/sports-01-md.jpg").
// We accept a raw string here (rather than Astro's image() helper) because Decap
// commits uploads to public/uploads/ which is served as-is. The Gallery component
// constructs a <picture> tag and uses native <img loading="lazy"> for new uploads.
// Existing migrated images point to pre-built variants under /assets/.
const photoSchema = z.object({
  image: z.string().describe('Path to the image (e.g. /uploads/photo.jpg)'),
  alt: z.string().min(1).describe('Required for accessibility'),
  caption: z.string().nullish(), // null-tolerant: the CMS may write an empty field as null (see width/height note below)
  span: SpanHint,
  order: z.number().int().default(100),
  // Internal — true when this photo was migrated from the pre-built pipeline and has
  // 3 sizes × 2 formats sitting next to it under /assets/. False (default) means it
  // was uploaded through the CMS and only the original exists.
  hasResponsiveVariants: z.boolean().default(false),
  // Optional manual width/height. The CMS writes these as an explicit `null`
  // (not an omitted key) when it can't read the image's dimensions on upload.
  // `.optional()` accepts a missing key but REJECTS an explicit null, which
  // aborts the whole `astro build` and blocks every deploy. `.nullish()`
  // (= number | null | undefined) accepts both. The Gallery component already
  // treats a missing dimension as "unknown", so null renders identically.
  width: z.number().int().nullish(),
  height: z.number().int().nullish(),
});

const sports = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sports' }),
  schema: photoSchema,
});

const landscape = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/landscape' }),
  schema: photoSchema,
});

// Folder stays "misc" for backward compatibility; it's surfaced as "Personal" in the UI.
const misc = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/misc' }),
  schema: photoSchema,
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: photoSchema,
});

const films = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/films' }),
  schema: z.object({
    title: z.string(),
    eyebrow: z.string().describe('Small label above the heading, e.g. "005 / Broadcast Journalism"'),
    headingPrefix: z.string().nullish().describe('Text shown before the italic word in the heading'),
    headingItalic: z.string().nullish().describe('The italicized word in the heading'),
    headingSuffix: z.string().nullish().describe('Text shown after the italic word'),
    description: z.string().describe('Short paragraph shown under the heading'),
    // Either a local file path under /uploads/ or /assets/, OR a YouTube/Vimeo URL.
    videoUrl: z.string().describe('Local path (e.g. /uploads/film.mp4) OR remote URL (YouTube/Vimeo)'),
    // For local files only: optional second rendition (1080p) and explicit MIME.
    // `.nullish()` (not `.optional()`) because the CMS writes an empty file/image
    // field as an explicit `null`, which `.optional()` would reject at build time.
    videoUrlHd: z.string().nullish().describe('Optional high-quality rendition for local files'),
    poster: z.string().nullish().describe('Poster image path (required for local files, optional for YouTube/Vimeo)'),
    section: z.string().describe('HTML id for the section anchor, e.g. "journalism" or "commercial"'),
    order: z.number().int().default(100),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  // pages share no fixed schema — about.md has bio fields, settings.md has site-level config.
  // We use a permissive schema and access the rendered body for bio HTML.
  schema: z.object({
    // Every field is `.nullish()` (not `.optional()`): the CMS writes a blank
    // field as an explicit `null`, and `.optional()` rejects null and fails the
    // build (see the width/height note above). All consumers read these via `??`
    // or truthy guards, so null and undefined behave identically downstream.
    // about.md
    aboutLede: z.string().nullish(),
    disciplines: z.string().nullish(),
    basedIn: z.string().nullish(),
    available: z.string().nullish(),

    // settings.md
    siteTitle: z.string().nullish(),
    siteDescription: z.string().nullish(),
    contactEmail: z.string().nullish(),
    contactPhone: z.string().nullish(),
    contactPhoneDisplay: z.string().nullish(),
    instagramUrl: z.string().nullish(),
    youtubeUrl: z.string().nullish(),
    tagline: z.string().nullish(),
    heroEyebrowLeft: z.string().nullish(),
    heroEyebrowRight: z.string().nullish(),
    heroNameLine1: z.string().nullish(),
    heroNameLine2: z.string().nullish(),
    heroRotation: z.array(z.string()).nullish(),
    ogImage: z.string().nullish(),
  }),
});

export const collections = { sports, landscape, misc, events, films, pages };
