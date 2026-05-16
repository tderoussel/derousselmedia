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
  caption: z.string().optional(),
  span: SpanHint,
  order: z.number().int().default(100),
  // Internal — true when this photo was migrated from the pre-built pipeline and has
  // 3 sizes × 2 formats sitting next to it under /assets/. False (default) means it
  // was uploaded through the CMS and only the original exists.
  hasResponsiveVariants: z.boolean().default(false),
  // Optional manual width/height in case Decap doesn't capture them.
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

const sports = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sports' }),
  schema: photoSchema,
});

const landscape = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/landscape' }),
  schema: photoSchema,
});

const misc = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/misc' }),
  schema: photoSchema,
});

const films = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/films' }),
  schema: z.object({
    title: z.string(),
    eyebrow: z.string().describe('Small label above the heading, e.g. "005 / Broadcast Journalism"'),
    headingPrefix: z.string().optional().describe('Text shown before the italic word in the heading'),
    headingItalic: z.string().optional().describe('The italicized word in the heading'),
    headingSuffix: z.string().optional().describe('Text shown after the italic word'),
    description: z.string().describe('Short paragraph shown under the heading'),
    // Either a local file path under /uploads/ or /assets/, OR a YouTube/Vimeo URL.
    videoUrl: z.string().describe('Local path (e.g. /uploads/film.mp4) OR remote URL (YouTube/Vimeo)'),
    // For local files only: optional second rendition (1080p) and explicit MIME.
    videoUrlHd: z.string().optional().describe('Optional high-quality rendition for local files'),
    poster: z.string().optional().describe('Poster image path (required for local files, optional for YouTube/Vimeo)'),
    section: z.string().describe('HTML id for the section anchor, e.g. "journalism" or "commercial"'),
    order: z.number().int().default(100),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  // pages share no fixed schema — about.md has bio fields, settings.md has site-level config.
  // We use a permissive schema and access the rendered body for bio HTML.
  schema: z.object({
    // about.md
    aboutLede: z.string().optional(),
    disciplines: z.string().optional(),
    basedIn: z.string().optional(),
    available: z.string().optional(),

    // settings.md
    siteTitle: z.string().optional(),
    siteDescription: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    contactPhoneDisplay: z.string().optional(),
    instagramUrl: z.string().optional(),
    tagline: z.string().optional(),
    heroEyebrowLeft: z.string().optional(),
    heroEyebrowRight: z.string().optional(),
    heroNameLine1: z.string().optional(),
    heroNameLine2: z.string().optional(),
    heroRotation: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }),
});

export const collections = { sports, landscape, misc, films, pages };
