#!/usr/bin/env node
// Migration script — runs ONCE to generate content collection markdown files
// from the existing site/asset-manifest.json and site/index.html.
//
// Reads:
//   - ../site/asset-manifest.json   (image dimensions, paths, slugs)
//   - ../site/index.html            (alt text, captions, spans, ordering)
//
// Writes:
//   - cms-site/src/content/sports/*.md   (21 files)
//   - cms-site/src/content/landscape/*.md (7 files)
//   - cms-site/src/content/misc/*.md     (2 files)
//   - cms-site/src/content/films/*.md    (2 files)
//   - cms-site/src/content/pages/about.md
//   - cms-site/src/content/pages/settings.md
//
// Safe to re-run (overwrites). To migrate fresh content from a different source,
// run this directly with node: `node scripts/migrate-content.mjs`

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REPO = resolve(ROOT, '..');
const LEGACY_SITE = join(REPO, 'site');
const CONTENT = join(ROOT, 'src', 'content');

// --- Helpers ------------------------------------------------------------
const yamlEscape = (s) => {
  // Minimal YAML string escaping; wrap in double quotes and escape \\ and ".
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
};

const writeMd = async (file, frontmatter, body = '') => {
  await mkdir(dirname(file), { recursive: true });
  const fm = Object.entries(frontmatter)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return `${k}:\n${v.map((x) => `  - ${yamlEscape(x)}`).join('\n')}`;
      }
      if (typeof v === 'boolean' || typeof v === 'number') return `${k}: ${v}`;
      return `${k}: ${yamlEscape(v)}`;
    })
    .join('\n');
  const out = `---\n${fm}\n---\n${body ? body + '\n' : ''}`;
  await writeFile(file, out, 'utf8');
};

const padIdx = (n) => String(n).padStart(2, '0');

// --- Load source data ---------------------------------------------------
const manifestPath = join(LEGACY_SITE, 'asset-manifest.json');
const indexPath = join(LEGACY_SITE, 'index.html');

if (!existsSync(manifestPath)) {
  console.error(`Missing ${manifestPath}`);
  process.exit(1);
}
if (!existsSync(indexPath)) {
  console.error(`Missing ${indexPath}`);
  process.exit(1);
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const html = await readFile(indexPath, 'utf8');

// --- Parse the index.html for alt text + captions + cell spans ----------
// Each <figure class="cell ..."> wraps a <picture> with one <img alt="..."/>.
// The src attribute points to assets/CATEGORY/slug-md.jpg — that's our slug key.

const figureRe = /<figure class="(cell[^"]*)"[^>]*>([\s\S]*?)<\/figure>/g;
const imgRe = /<img\s+src="([^"]+)"\s+alt="([^"]+)"/;
const parsedCells = [];
let m;
while ((m = figureRe.exec(html)) !== null) {
  const classList = m[1];
  const inner = m[2];
  const im = imgRe.exec(inner);
  if (!im) continue;
  const src = im[1]; // assets/sports/sports-13-md.jpg
  const alt = im[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&rsquo;/g, '’').replace(/&ndash;/g, '–');
  // Slug from path.
  const sm = src.match(/assets\/(\w+)\/([\w-]+)-md\.(?:jpg|jpeg|webp|png)/i);
  if (!sm) continue;
  const category = sm[1].toLowerCase();
  const slug = sm[2];
  // Derive span hint. Most photos get `auto` — the mosaic algorithm produces a
  // varied editorial grid by default. We only preserve the truly intentional
  // emphasis: full-bleed cell-w12 cell-h-wide. Anything else is `auto` so new
  // photos uploaded by Alex slot in naturally without him picking sizes.
  let span = 'auto';
  const isWide = /\bcell-w12\b/.test(classList) && /\bcell-h-wide\b/.test(classList);
  if (isWide) span = 'wide';
  parsedCells.push({ category, slug, src, alt, span });
}

// Build a slug -> {alt, span, order} map by category.
const cellMeta = new Map(); // key = `${category}/${slug}`
let nextOrder = { sports: 10, landscape: 10, misc: 10 };
for (const c of parsedCells) {
  const key = `${c.category}/${c.slug}`;
  if (cellMeta.has(key)) continue; // first occurrence wins
  cellMeta.set(key, { alt: c.alt, span: c.span, order: nextOrder[c.category] ?? 100 });
  nextOrder[c.category] = (nextOrder[c.category] ?? 100) + 10;
}

// --- Write image collections --------------------------------------------
let counts = { sports: 0, landscape: 0, misc: 0 };

// Clear existing content folders so re-runs don't leave stale files.
for (const cat of ['sports', 'landscape', 'misc']) {
  const dir = join(CONTENT, cat);
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true });
  }
}

for (const img of manifest.images) {
  const cat = img.category; // sports | landscape | misc
  const slug = img.slug;
  const key = `${cat}/${slug}`;
  const meta = cellMeta.get(key);

  // Default alt if not in HTML (shouldn't happen but defensive).
  const alt = meta?.alt ?? `${cat} photo ${img.index}`;
  const span = meta?.span ?? 'auto';
  const order = meta?.order ?? (img.index * 10);

  const mdPath = join(CONTENT, cat, `${slug}.md`);
  const md = `/${img.variants.md.jpg}`; // /assets/.../slug-md.jpg

  await writeMd(mdPath, {
    image: md,
    alt,
    span,
    order,
    hasResponsiveVariants: true,
    width: img.originalWidth,
    height: img.originalHeight,
  });
  counts[cat] = (counts[cat] ?? 0) + 1;
}

// --- Write film collection ----------------------------------------------
if (existsSync(join(CONTENT, 'films'))) {
  await rm(join(CONTENT, 'films'), { recursive: true, force: true });
}

const filmEntries = [
  {
    slug: 'journalism-reel',
    section: 'journalism',
    title: 'Broadcast Journalism Reel',
    eyebrow: '005 / Broadcast Journalism',
    headingPrefix: 'Broadcast',
    headingItalic: '',
    headingSuffix: 'Reel',
    description: 'A condensed cut of broadcast journalism segments — reporting, hosting, and on-camera work.',
    videoUrl: '/assets/video/journalism-reel-720.mp4',
    // 1080p was dropped from the repo for size reasons; document in handoff for upload to Cloudinary/YouTube.
    videoUrlHd: '',
    poster: '/assets/video/journalism-reel-poster.jpg',
    order: 10,
  },
  {
    slug: 'adidas-commercial',
    section: 'commercial',
    title: 'Adidas Commercial',
    eyebrow: '006 / Commercial',
    headingPrefix: 'Adidas',
    headingItalic: 'Commercial',
    headingSuffix: '',
    description: 'A spec commercial concept directed and edited for adidas — concept, cinematography, and post.',
    videoUrl: '/assets/video/adidas-commercial-720.mp4',
    videoUrlHd: '',
    poster: '/assets/video/adidas-commercial-poster.jpg',
    order: 20,
  },
];

// Heading layout differs per film — encode the parts so the page can build the right HTML.
// For journalism: <em>Broadcast</em>&nbsp;Reel   → headingPrefix="Broadcast" (italic), headingSuffix="Reel"
//   We're using headingItalic field as "italicized middle word"; let's correct: for journalism,
//   the italic word is "Broadcast" (prefix), and "Reel" is the suffix.
//   For commercial: Adidas <em>Commercial</em>   → prefix="Adidas", italic="Commercial".
// To make this clean: headingPrefix renders as plain text BEFORE the italic; headingItalic is the
// italic word; headingSuffix is plain text AFTER. For journalism the italic IS the first word, so
// we'll handle that by having headingPrefix="" and headingItalic="Broadcast", headingSuffix="Reel".

filmEntries[0].headingPrefix = '';
filmEntries[0].headingItalic = 'Broadcast';
filmEntries[0].headingSuffix = 'Reel';

filmEntries[1].headingPrefix = 'Adidas';
filmEntries[1].headingItalic = 'Commercial';
filmEntries[1].headingSuffix = '';

for (const f of filmEntries) {
  const mdPath = join(CONTENT, 'films', `${f.slug}.md`);
  await writeMd(mdPath, {
    title: f.title,
    section: f.section,
    eyebrow: f.eyebrow,
    headingPrefix: f.headingPrefix,
    headingItalic: f.headingItalic,
    headingSuffix: f.headingSuffix,
    description: f.description,
    videoUrl: f.videoUrl,
    videoUrlHd: f.videoUrlHd,
    poster: f.poster,
    order: f.order,
  });
}

// --- Pages: about.md + settings.md --------------------------------------
await mkdir(join(CONTENT, 'pages'), { recursive: true });

await writeMd(join(CONTENT, 'pages', 'about.md'), {
  aboutLede: 'Alex DeRoussel is a videographer, photographer, and broadcast journalist working in sports, landscape, and commercial film. He shoots college athletics, on-the-ground reporting, and concept-led commercial spots, with an eye for available light and the quiet moments around the action.',
  disciplines: 'Photography · Video · Broadcast',
  basedIn: 'Washington, D.C. area',
  available: 'Editorial · Commercial · NIL',
}, '');

await writeMd(join(CONTENT, 'pages', 'settings.md'), {
  siteTitle: 'DeRoussel Media — Visual storytelling by Alex DeRoussel',
  siteDescription: 'DeRoussel Media is the portfolio of Alex DeRoussel: sports photography, landscape, broadcast journalism, and commercial work.',
  tagline: 'Sports, landscape, broadcast journalism, and commercial work by <span class="nowrap">Alex DeRoussel.</span>',
  heroEyebrowLeft: 'est. 2024',
  heroEyebrowRight: 'visual storytelling',
  heroNameLine1: 'DeRoussel',
  heroNameLine2: 'Media',
  heroRotation: [
    '/assets/sports/sports-13-md.jpg',
    '/assets/sports/sports-09-md.jpg',
    '/assets/landscape/landscape-05-md.jpg',
    '/assets/sports/sports-04-md.jpg',
  ],
  contactEmail: 'derousselmedia@gmail.com',
  contactPhone: '+15139688918',
  contactPhoneDisplay: '(513) 968–8918',
  instagramUrl: '',
  ogImage: '/assets/sports/sports-13-lg.jpg',
}, '');

console.log('Migration complete:');
console.log(`  sports/    ${counts.sports} files`);
console.log(`  landscape/ ${counts.landscape} files`);
console.log(`  misc/      ${counts.misc} files`);
console.log(`  films/     ${filmEntries.length} files`);
console.log(`  pages/     2 files (about.md, settings.md)`);
