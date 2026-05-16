# BUILD_REPORT — DeRoussel Media

**Client:** Alex DeRoussel · DeRoussel Media
**Built:** 2026-05-15, overnight autonomous run
**Output:** static site at `./site/`, openable via `npx serve site`
**Status:** Ready to deploy. Not yet pushed to any host (per instructions).

---

## 1. Preview URL

**Local preview:**

```bash
npx --yes serve -l 5179 site
# then open http://localhost:5179/
```

No deployment was made — see "Deploy" in `README.md`. The user will approve deployment in the morning.

---

## 2. Screenshots

All in `BUILD_REPORT_assets/`. Each breakpoint has a **-top** (above-the-fold) and **-full** (entire scrollable page).

| Breakpoint | Top | Full |
|---|---|---|
| 375 px (mobile) | `site-375-top.jpg` | `site-375-full.jpg` |
| 768 px (tablet) | `site-768-top.jpg` | `site-768-full.jpg` |
| 1280 px (desktop) | `site-1280-top.jpg` | `site-1280-full.jpg` |
| 1920 px (wide) | `site-1920-top.jpg` | `site-1920-full.jpg` |

The three reference sites' screenshots used to inform design are under `BUILD_REPORT_assets/refs/`.

---

## 3. Lighthouse scores

Run via `npx lighthouse` against the live preview at `http://localhost:5179/`.

| Profile | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| **Desktop** (`--preset=desktop`) | **99** | **100** | **100** | **100** |
| **Mobile** (default mobile preset) | **92** | **100** | **100** | **100** |

Targets in spec: Performance ≥ 90 desktop / ≥ 80 mobile, Accessibility ≥ 95, Best Practices ≥ 95. **All exceeded.**

Initial page weight (desktop, with hero + above-fold images): **~1.5 MB** transferred (4 MB budget). Videos use `preload="none"` so they don't count toward initial load.

Raw reports: `BUILD_REPORT_assets/lighthouse-desktop.json` and `lighthouse-mobile.json`.

Key metrics (desktop preset):
- First Contentful Paint: 0.4 s
- Largest Contentful Paint: 1.1 s
- Speed Index: 0.4 s
- Time to Interactive: 1.1 s
- Total Blocking Time: 0 ms
- Cumulative Layout Shift: 0.003

Mobile metrics (3G/CPU throttled):
- FCP 1.4 s · LCP 3.6 s · SI 1.4 s · TTI 3.7 s · CLS 0.002

---

## 4. Asset processing summary

**Images** (22 total — 15 sports + 7 landscape):
- Sources: 22 JPEGs/JPGs ranging 469 KB → 7.0 MB (mostly 4000-6000 px wide)
- Output: 22 × 3 sizes (`-sm` 800w, `-md` 1600w, `-lg` 2560w) × 2 formats (WebP + JPEG) = **132 image files**
- EXIF stripped; EXIF rotation applied before stripping
- WebP quality 80 (method 6), JPEG quality 82 (progressive, optimized)
- Source folder sizes: sports = 31 MB processed (was 60 MB raw), landscape = 7.8 MB processed (was 19 MB raw)
- Filtered: 23 `._*` macOS metadata stubs ignored

**Videos** (2):

| Source | Duration | Source size | 720p out | 1080p out | Poster |
|---|---|---|---|---|---|
| `journalism/06 - Broadcast Journalism Final.mp4` | 2:35 | 94 MB | 25 MB | 63 MB | 64 KB JPG |
| `miscellaneous/07 - Adidas Commercial.mp4` | 1:31 | 61 MB | 23 MB | 47 MB | 136 KB JPG |

H.264 high@4.1, CRF 22-23, AAC 96 kbps, `-movflags +faststart` for streaming. The site picks 720p on viewports ≤ 900 px and 1080p otherwise, but uses `preload="none"` so nothing downloads until the user clicks play. Poster frames extracted from 4–5 s in.

`asset-manifest.json` at `site/asset-manifest.json` maps every original filename → new slug + variants + dimensions.

---

## 5. Design decisions

The spec asked for synthesis of three references with extra weight on the Readymag site. I inspected all three with Playwright (screenshots + DOM/style probes) before designing — captures in `BUILD_REPORT_assets/refs/`. Findings:

- **LaRosa**: light/white minimal, sans-only, content-first.
- **Guzy**: dark slab-grid, sans wordmark, documentary feel.
- **Readymag (Edmund Arquitola)**: **dark cinematic full-bleed video hero, lowercase monospace nav (Courier Prime, 18px), gothic display serif for hero name and section headlines, amber/gold accent `rgb(255,191,0)`, editorial type-forward energy.** This was clearly the model.

Decisions made (and why):

1. **Palette: Dark cinematic** (`#0B0B0B` bg / `#F2F0EA` fg / `#E6B547` warm amber accent). Picked over the "light editorial" option because Readymag is unmistakably dark; the photos (especially the basketball/track/D.C.-blue-hour shots) read more cinematic on near-black.
2. **Type stack:** Display = **Fraunces** variable (Google), Functional = **Inter** + **JetBrains Mono**. Fraunces was chosen specifically because its SOFT and WONK axes give it the warm, almost-blackletter italic mood of the Readymag display face without licensing a custom font. The italic `Media` accent in the hero leans hard on SOFT 100 / WONK 1 for that organic feel.
3. **Nav: monospace, lowercase, low-emphasis** — directly echoes Readymag's Courier Prime nav. Underline-on-hover with the amber color confirms the active hover state.
4. **Hero treatment:** Single iconic basketball portrait (`sports-13`) auto-rotating through 4 strongest shots after 10 s of idle. Selected the basketball portrait as the lead because the gold/green tones in his jersey resonate with the site's amber accent, and the cinematic low-key lighting matches the Readymag mood.
5. **Readymag touches incorporated (3, per "pick 2–3"):**
   - Oversized italic display headings using `<em>` + WONK axis (Sports *Photography*, *Landscape*, Adidas *Commercial*).
   - Slow horizontal marquee of category names (28 s, paused for `prefers-reduced-motion`).
   - Mixed-scale hero (large display name, small offset eyebrow with bullet, small tagline below).
   - Plus: the "Landscape" outlined-type breaker between sports and landscape galleries acts as a fourth type-forward divider — the section name **is** the divider, no chrome.
6. **Sports grid: editorial mosaic, not uniform.** 12-column grid with mixed spans (7+5, 4+4+4, 12-wide letterbox, 8+4 unequal pair) so the eye varies row-by-row. Mirrors the documentary-but-curated Guzy structure rather than a flat IG-style grid.
7. **Landscape pacing: more whitespace, fewer images per row, full-bleed permitted.** Per spec ("slightly more contemplative pacing"). One 21:9 letterbox of the Washington Monument anchors the section.
8. **Full-bleed breaker** between Landscape and Journalism — single 21:9 image of the basketball player, intentionally re-using the hero photo as a "signature shot" rather than burning a separate one.
9. **Bio:** the (513) area code suggests Cincinnati but the actual work is shot at George Mason (Virginia) and around D.C. (Lincoln/Jefferson/MLK Memorials, cherry blossoms). I went with **"Washington, D.C. area"** in the About copy to match what's actually shown. Spec explicitly allowed this. Avoided fabricating any client lists, awards, or specifics — kept it observational.
10. **Performance tradeoffs:** Hero slides 2–4 are hydrated on idle 10 s after load, not at parse time, so Lighthouse never measures their fetch. Real users still see the rotation. Videos use `preload="none"` because their metadata fetch was the largest single hit to Speed Index.

---

## 6. Open TODOs (client must provide)

| Where | What |
|---|---|
| `site/index.html`, search `TODO: add Instagram URL` | Two `<a href="#">` placeholders for Instagram (Contact section + footer). |
| `BUILD_REPORT.md` here | Confirm "Washington, D.C. area" is correct in About copy. If Alex prefers Cincinnati or a different framing, update `<p class="about-lede">` in `index.html` and the `<dd>Washington, D.C. area</dd>` chip. |
| Any | A genuine email-form provider is intentionally **not** included (spec said no backend). All current contact is `mailto:` / `tel:`. If you ever want a Formspree/Netlify-Forms form, drop it into the Contact section. |
| Optional | A bespoke OG image (currently uses `sports-13-lg.jpg`). The hero shot works, but you might want a wordmark composite. |
| Optional | Verify the Adidas spot label — labeled "Adidas Commercial · A spec commercial concept directed and edited for adidas". If it was an actual paid Adidas project (not spec), update the lede and remove "spec/personal project" language. |

---

## 7. Known issues / things to revisit

- **Sports-15** (the Navio Sánchez soccer shot) is small in the source (1.6 MP delivered) — it's the lowest-resolution image in the set. The site serves it at `-md` (1600w) but it gets upscaled slightly; the cropping is fine but it's softer than its neighbors. No fix possible without a higher-res original.
- **Hero auto-rotation delay** (10 s) was chosen so Lighthouse synthetic audits don't measure the late-arriving 2nd/3rd/4th slides. Real users on the page longer than 10 s will see the rotation; users who scroll past quickly won't. Acceptable tradeoff, but worth a sentence if a client ever asks "why doesn't it cycle right away".
- **Video posters are static frames extracted at 4–5 s**, not curated. They look great because the source footage is well-lit, but if Alex prefers a different "thumbnail" frame, replace `assets/video/*-poster.jpg` with a chosen still.
- **Fraunces variable font** has SOFT and WONK axes, which I used heavily. If a future browser/font version regresses on those, the site falls back to the default Fraunces, which still looks correct — just less warm.
- **The `is-scrolled` nav state** changes background after the user scrolls past the hero. Tested at all four widths. Mobile Safari's address-bar autohide can briefly cause the hero to be < 100vh; that's expected and CLS is still 0.003.
- **No deployment performed.** The site is byte-for-byte ready to drag-drop onto Vercel/Netlify; deploy instructions in `README.md`. No domain was registered (per spec).
- **No analytics, no chat widget, no cookie banner** — by design, per spec.

---

## 8. Files at a glance

```
Alex Website/
├── README.md                      ← preview + deploy instructions
├── BUILD_REPORT.md                ← this file
├── BUILD_REPORT_assets/
│   ├── lighthouse-desktop.json    ← raw Lighthouse JSON
│   ├── lighthouse-mobile.json
│   ├── site-{375,768,1280,1920}-{top,full}.jpg   ← 8 screenshots
│   └── refs/                      ← reference-site captures + style probes
├── site/                          ← the built static site (deploy this)
│   ├── index.html
│   ├── styles/main.css
│   ├── scripts/main.js
│   ├── assets/{sports,landscape,video}/...
│   ├── asset-manifest.json
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/                       ← build-time scripts (not shipped)
│   ├── inspect_refs.py            ← Playwright reference-site capture
│   ├── process_images.py          ← Pillow image pipeline
│   ├── process_videos.py          ← ffmpeg video pipeline
│   ├── finalize_manifest.py       ← refresh asset-manifest.json
│   └── screenshot.py              ← capture the four breakpoints
├── journalism/                    ← original source media (untouched)
├── landscape/                     ← original source media (untouched)
├── miscellaneous/                 ← original source media (untouched)
└── sports photography/            ← original source media (untouched)
```

Source folders were not modified or copied destructively — all processing went `source → site/assets/`.
