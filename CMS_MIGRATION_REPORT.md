# CMS migration report — DeRoussel Media

**Built:** 2026-05-16, autonomous run
**Output:** Astro 6 + Decap CMS 3 portfolio at `cms-site/`
**Status:** Ready to push to GitHub. Not yet deployed (per instructions).

---

## What was built

A complete content-managed rebuild of the existing static portfolio, preserving the design language, photos, videos, and SEO while adding a non-developer-friendly admin.

### New things

- **`cms-site/`** — Astro 6 project that produces a static `dist/` identical in look-and-feel to the legacy site. Zero JS frameworks; vanilla `main.js` reused verbatim.
- **Typed content collections** under `cms-site/src/content/`: `sports/` (21 markdown files), `landscape/` (7), `misc/` (2), `films/` (2), `pages/` (about + settings). Schemas are defined in `cms-site/src/content.config.ts` with Zod, including a `span` enum and `hasResponsiveVariants` flag.
- **Components** under `cms-site/src/components/`: `Hero`, `SiteHeader`, `Marquee`, `WorkIndex`, `SectionHeader`, `Gallery`, `TypeBreaker`, `VideoSection`, `About`, `Contact`, `SiteFooter`, `Lightbox`. Each is small and composable; the page is `cms-site/src/pages/index.astro`.
- **Editorial mosaic algorithm** at `cms-site/src/lib/mosaic.ts`. A walk through 7 hand-tuned row templates with auto-promotion of ultra-wide photos (aspect ≥ 1.7) to full-bleed. Alex's new photos slot in with no manual span picking required.
- **Image path helper** at `cms-site/src/lib/image-paths.ts`. Existing photos (with pre-built `-sm`/`-md`/`-lg` variants × jpg/webp) render through `<picture>` + `srcset` exactly as before; new CMS uploads serve from `/uploads/` at original size.
- **Decap CMS admin** at `cms-site/public/admin/` with `index.html` (loader) and `config.yml` (5 collections defined with widgets, hints, sort orders, summary templates). Backend = `git-gateway`, branch = `main`, editorial workflow disabled (direct publish for simplicity).
- **Migration script** at `cms-site/scripts/migrate-content.mjs` — a one-shot Node script that reads `site/asset-manifest.json` + parses `site/index.html` to produce the 32 initial markdown files. Safe to re-run.
- **Netlify config** at the repo root: `netlify.toml` with base dir, build command, publish dir, cache headers for `/_astro/`, `/assets/`, `/uploads/`, and `/admin/`.
- **Root `.gitignore`** excluding `node_modules`, `dist`, `.astro`, the legacy `site/` directory, the raw source folders (`journalism/`, `landscape/`, etc.), Lighthouse outputs, and editor cruft.
- **Two onboarding docs**: `ALEX_ONBOARDING.md` (plain-English editor guide) and `DEVELOPER_SETUP.md` (full deployment runbook with the exact Netlify click-path for Identity + Git Gateway, custom domain setup, troubleshooting, and future-work suggestions).

### What was preserved (no changes)

- `site/` — the legacy hand-tuned site stays intact on disk for reference (also still serves at `localhost:5179` exactly as before).
- `scripts/` — the legacy Python pipeline (`process_images.py`, `process_videos.py`, `finalize_manifest.py`) stays. Documented as "rare-use bulk operation tool" in DEVELOPER_SETUP.
- Source media in `journalism/`, `landscape/`, `miscellaneous/`, `sports photography/` — untouched.

### What was skipped (deliberately)

- **`@astrojs/image` / Sharp processing of CMS uploads.** Astro 6's `astro:assets` works for files in `src/`, not `public/`. Decap commits to `public/uploads/` so the file is browser-visible immediately on save. Building a Sharp-based processor for `/uploads/` is a 1–2 hour future task documented in `DEVELOPER_SETUP.md` → "What I'd do next". For now, new uploads serve at original resolution with `loading="lazy"`. Alex's typical phone/camera photos are 1–4 MB JPEG — single-resolution serving is fine for portfolio quality.
- **Sitemap auto-generation.** Kept the static `public/sitemap.xml` (1 URL) from the legacy site rather than install `@astrojs/sitemap`. Future-work note in the developer guide.
- **Editorial workflow / preview branches.** Decap supports a draft → review → publish flow, but it adds friction for a single-author site. Direct publish is the default.
- **`@astrojs/check` for type validation in CI.** Not blocking; the build itself is fully typed.
- **Cloudinary/YouTube preset for large videos.** The films collection already accepts YouTube/Vimeo URLs (auto-detected and embedded). Cloudinary preset is a future addition.

### What surprised me

1. **The npm-create-astro CLI flag parsing in this Astro 6 version is positional-only**: `--typescript=strict` is parsed as the project name when prefixed before the positional arg, not the flag. Easy workaround once you notice. (Documented in case the developer re-scaffolds.)
2. **The hero image preload needs `imagesrcset`+`imagesizes`**, not just `href`. My first pass hardcoded `href="...-md.webp"` which forced mobile to fetch the 313 KB md variant instead of the 75 KB sm. Cost 9 Lighthouse points on mobile. Fix was a 4-line edit to `BaseLayout.astro`. Worth flagging because the legacy `index.html` got it right at line 31 with the full imagesrcset/imagesizes attributes — easy to miss when copying.
3. **Decap's `media_folder` and `folder` paths are repo-root-relative, not Astro-project-relative.** Once the repo is initialized at the project root (one level above `cms-site/`), the config needs `cms-site/...` prefixes. Subtle gotcha that would fail silently in production.

---

## Lighthouse: before vs after

Run with `npx lighthouse <url> [--preset=desktop]` against `localhost:5179` (legacy) and `localhost:5180` (new build of `cms-site/dist`).

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| **Legacy desktop** | 99 | 100 | 100 | 100 |
| **New desktop**    | 99 | 100 | 100 | 100 |
| **Legacy mobile**  | 90 | 100 | 100 | 100 |
| **New mobile**     | 92 | 100 | 100 | 100 |

**Result: new build matches or exceeds legacy across the board.** Well within the 5-point budget on every category.

Raw Lighthouse JSON (the four files): `CMS_MIGRATION_assets/lighthouse-{legacy,new}-{desktop,mobile}.json`.

Key mobile metrics (new build):
- FCP 1.4 s · LCP 3.5 s · SI 1.4 s · TBT 0 ms · CLS 0.002 · TTI 3.6 s

---

## Repo size

| | Before (legacy) | After (new + legacy on disk) | After (git-tracked only) |
|---|---|---|---|
| `cms-site/public/assets/` | n/a | 99 MB | 99 MB |
| `cms-site/src/` + components | n/a | 159 KB | 159 KB |
| `site/` (legacy) | 208 MB | 208 MB | **excluded via .gitignore** |
| `journalism/`, `landscape/`, etc. (raw source) | ~400 MB | ~400 MB | **excluded via .gitignore** |
| **Git-tracked size after migration** | n/a | n/a | **~100 MB** |

The 250 MB budget is comfortably met. The biggest single chunk is `cms-site/public/assets/video/` at 48 MB (two 720p MP4s + posters). The 1080p MP4 renditions (147 MB combined) were **dropped from the new repo** to fit; they're documented in DEVELOPER_SETUP.md for future migration to Cloudinary/YouTube if Alex wants higher-quality desktop playback.

---

## Open questions / decisions deferred

1. **Domain registration timing.** Spec said no domain registration. The Decap config currently hardcodes `https://derousselmedia.com` as `site_url`. If a different domain is chosen, edit `cms-site/public/admin/config.yml` (`site_url`, `display_url`) and `cms-site/astro.config.mjs` (`site:`).
2. **1080p videos.** Currently the site serves only the 720p H.264 rendition of each film. Larger files would need Cloudinary/YouTube hosting; documented as a v1.1 task. Alex's current `.netlify.toml` cache config gives long-cache headers on `/assets/` so the videos cache hard at the edge.
3. **OG share image.** Defaults to `/assets/sports/sports-13-lg.jpg` (the basketball portrait). Alex can override per-page later or keep as-is. Editable via Site settings → Open Graph share image.
4. **Instagram URL.** Left blank by default; appears as a muted link in the footer until Alex fills it via Site settings.
5. **Bio framing.** Carried over from the legacy site: "Washington, D.C. area" (since the (513) Cincinnati area code didn't match the actual work shown — George Mason/D.C. monuments). Editable via Pages → About page.
6. **Mosaic differences for positions 17-21 of the Sports gallery.** See "Layout deviations" below.

---

## Layout deviations (Sports gallery, positions 17-21)

The mosaic algorithm produces the same first 16 photos as the hand-tuned original (hero portrait + tall, triptych, full-bleed, unequal pair, tall pair + landscape demoted, equal pair, unequal pair, full-bleed). After the second full-bleed (position 16 = sports-20), the algorithm picks up template 6 (`w5/w7`) instead of the original's hand-chosen template 3 (`w4 tall × 3`). Result:

| Pos | Original | New build |
|---|---|---|
| 17 | sports-16 (w4 tall) | sports-16 (w5) |
| 18 | sports-19 (w4 tall) | sports-19 (w7) |
| 19 | sports-21 (w4 tall) | sports-21 (w7 tall) |
| 20 | sports-18 (w7) | sports-18 (w5 tall) |
| 21 | sports-17 (w5) | sports-17 (w4) |

**Honest assessment**: this is visibly different from the original. The original ends with two tight rows of tall portraits then a wide pair, which is editorially stronger because it gives the eye a final emphasis. My algorithm's output for these 5 photos is more scattered — still varied, still editorial, but less intentional.

**Mitigation options for Alex:**
1. Use the **Emphasis** field to set `tall` on sports-16, 19, and 21 explicitly. The algorithm honors explicit hints. (Each explicit `tall` becomes a single w4 tall cell; three in a row = the original triptych.)
2. Leave as-is — most visitors won't compare with the legacy site.
3. Ask the developer to tweak the template sequence in `cms-site/src/lib/mosaic.ts` to favor tall-triptych more aggressively.

Beyond this, **all other photo ordering matches the legacy site identically** (verified by comparing photo slugs in DOM order in both builds).

The Landscape gallery is also a close match: 7 photos, same order, with positions 5–6 served as w4/w4 instead of w7/w5 (a minor variance, still editorial). Misc is w7/w5 instead of w6/w6.

---

## Verification checklist

- [x] `cd cms-site && npm install && npm run build` succeeds clean (no warnings beyond expected Astro telemetry notice).
- [x] `npx --yes serve cms-site/dist -l 5180` serves the new build. All 21 sports + 7 landscape + 2 misc + 2 videos present. All three type-breakers (Landscape, Miscellaneous, Film) render. 30 figures, 2 video sections, 3 type-breakers, hero, work index, marquee, about, contact, footer — all in correct order.
- [x] Decap admin loads at `/admin/` (HTTP 200, config.yml HTTP 200 with `text/yaml` content type via netlify.toml header). YAML config validates with all 5 collections defined.
- [x] End-to-end CMS test: dropped `public/uploads/test-photo.jpg` + `src/content/sports/zzz-cms-test.md`; rebuild picked up the new photo as the 22nd sports cell. Cleaned up after.
- [x] Lightbox markup verified in build output. Bound to `[data-lightbox-group]` for all 3 galleries.
- [x] Lighthouse (new build): desktop 99/100/100/100, mobile 92/100/100/100. Both within 5 points of legacy.
- [x] `ALEX_ONBOARDING.md` reread from a non-developer perspective — covers first-time setup, daily use (photo + video flows), edit/reorder/remove, what-if-broken, FAQ.
- [x] `DEVELOPER_SETUP.md` runbook end-to-end: local check → git push → Netlify import → Identity/Git Gateway enable → invite → custom domain → DNS → HTTPS → smoke test. Plus troubleshooting and "what I'd do next".
- [x] Initial git commit created at repo root with `.gitignore` excluding legacy/raw source.

---

## Next steps for the developer

In order:

1. **Push to GitHub.** Follow DEVELOPER_SETUP.md → "Step 2 — Push to GitHub". The repo is initialized locally with one clean commit.
2. **Import to Netlify.** Step 3 in the developer guide. Build settings auto-detect from `netlify.toml`.
3. **Enable Identity + Git Gateway.** Step 4. This is the critical click-path that unlocks the admin.
4. **Invite Alex** (or a test email first to smoke-test). Step 5.
5. **Test the full flow yourself** before handing over: sign in to the admin, add a test photo to Sports, publish, verify the deploy rebuilds and the photo appears live within ~30 seconds. Delete the test photo.
6. **Hand Alex `ALEX_ONBOARDING.md`** and your contact info.
7. **Register the domain when ready** and follow Step 6 in DEVELOPER_SETUP.

Optional (any time after the above):

- Migrate 1080p videos to Cloudinary or YouTube and update the films collection.
- Add Sharp-based `/uploads/` processing for fully-responsive new uploads.
- Switch to `@astrojs/sitemap` for auto-generated sitemap.

---

## Files inventory

```
Alex Website/
├── .gitignore                          ← excludes legacy/raw source/node_modules
├── .env.example
├── netlify.toml                        ← Netlify build + cache headers
├── README.md                           ← brief; points to the three guides
├── ALEX_ONBOARDING.md                  ← Alex's editor guide
├── DEVELOPER_SETUP.md                  ← deployment runbook
├── CMS_MIGRATION_REPORT.md             ← this file
├── BUILD_REPORT.md                     ← original build report (kept for reference)
│
├── site/                               ← LEGACY hand-tuned site (preserved on disk)
├── scripts/                            ← LEGACY Python pipeline (preserved)
├── journalism/, landscape/, …          ← original raw source (preserved on disk, .gitignored)
│
└── cms-site/                           ← NEW: the Astro + Decap project
    ├── astro.config.mjs
    ├── package.json, package-lock.json
    ├── tsconfig.json
    ├── public/
    │   ├── admin/index.html            ← Decap loader
    │   ├── admin/config.yml            ← Decap collections config (5 collections)
    │   ├── assets/                     ← pre-optimized images (copied from legacy site)
    │   │   ├── sports/  (21 × 6 files)
    │   │   ├── landscape/ (7 × 6 files)
    │   │   ├── misc/    (2 × 6 files)
    │   │   └── video/   (2 × 720p + posters; 1080p dropped to fit budget)
    │   ├── uploads/.gitkeep            ← where Decap commits new uploads
    │   ├── main.js                     ← vanilla JS for lightbox + hero rotation (verbatim from legacy)
    │   ├── favicon.svg, robots.txt, sitemap.xml
    │
    ├── src/
    │   ├── content.config.ts           ← typed Zod schemas for 5 collections
    │   ├── content/
    │   │   ├── sports/   (21 .md files, one per photo)
    │   │   ├── landscape/ (7 .md files)
    │   │   ├── misc/     (2 .md files)
    │   │   ├── films/    (2 .md files)
    │   │   └── pages/    (about.md + settings.md)
    │   ├── components/   (12 .astro components)
    │   ├── layouts/BaseLayout.astro
    │   ├── lib/mosaic.ts, image-paths.ts
    │   ├── pages/index.astro           ← THE page (composes from collections)
    │   └── styles/main.css             ← verbatim from legacy site
    │
    └── scripts/migrate-content.mjs     ← one-shot legacy-to-content migration (run once; safe to re-run)
```
