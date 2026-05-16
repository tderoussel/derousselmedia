# Developer setup runbook — DeRoussel Media CMS

A start-to-finish playbook for getting Alex's portfolio live with the new admin. Read top-to-bottom on the first pass; bookmark sections for re-reference later.

> **Audience:** the developer (you). For Alex's day-to-day editor docs, see `ALEX_ONBOARDING.md`.

---

## Architecture overview

```
                          ┌────────────────────────┐
                          │  Alex's browser        │
                          │  derousselmedia.com    │
                          │  /admin/               │
                          └─────────┬──────────────┘
                                    │ (signed JWT via Netlify Identity)
                                    ▼
   ┌──────────────────────────────────────────────────────────┐
   │  Netlify Git Gateway   (proxies signed commits to GitHub) │
   └─────────┬──────────────────────────────────────────────────┘
             │ git push
             ▼
   ┌──────────────────────────────────────────────────────────┐
   │  GitHub repo (origin)                                     │
   │  cms-site/  ← Astro project                              │
   │  netlify.toml, ALEX_ONBOARDING.md, this file             │
   └─────────┬──────────────────────────────────────────────────┘
             │ webhook on push to main
             ▼
   ┌──────────────────────────────────────────────────────────┐
   │  Netlify build  →  Astro `npm run build`  →  cms-site/dist │
   │  Deploy to CDN edge nodes                                 │
   └──────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          ┌────────────────────────┐
                          │  Public visitors       │
                          │  derousselmedia.com    │
                          └────────────────────────┘
```

**The flow when Alex edits:** Browser → Identity (sign-in) → Decap CMS app loads → save commits via Git Gateway → GitHub receives commit → Netlify rebuilds → live in ~30 seconds.

---

## Stack

- **Astro 6** — static site generator. Zero JS by default; ships only the vanilla `main.js` for the lightbox + hero rotation.
- **Decap CMS 3.8** — admin UI, runs entirely in Alex's browser.
- **Netlify Identity + Git Gateway** — auth and signed git commits.
- **Netlify** — hosting + CI build.
- **GitHub** — git remote (any provider Netlify supports works; instructions below use GitHub).

**Why this stack?** It's the canonical "non-technical user edits a static site through a web admin" stack as of 2026, fits in the free tier for a portfolio of this size, and stays out of the way — Alex never opens a terminal.

---

## Step 1 — Local check before pushing

From the project root (`Alex Website/`):

```bash
cd cms-site
npm install
npm run build
```

Should complete in <10 seconds with no errors. Output is in `cms-site/dist/`.

Preview locally:
```bash
npx --yes serve cms-site/dist -l 5180
# open http://localhost:5180
```

Sanity-check:
- 21 sports + 7 landscape + 2 misc photos render
- Both video sections present (Journalism Reel + Adidas Commercial)
- About, Contact, Footer
- Click an image — lightbox opens, arrow keys navigate, Esc closes
- Browser console: no errors

---

## Step 2 — Push to GitHub

This step is **not** automated — do it once by hand.

From the project root:

```bash
git init -b main
git add .gitignore .env.example netlify.toml \
        ALEX_ONBOARDING.md DEVELOPER_SETUP.md CMS_MIGRATION_REPORT.md README.md \
        cms-site
git status   # double-check nothing weird is staged
git commit -m "Initial: Astro + Decap CMS portfolio for DeRoussel Media"
git remote add origin git@github.com:YOUR_GH_USER/derousselmedia.git   # replace
git push -u origin main
```

**Things to check before pushing:**
- Repo size: `du -sh .git` — should be under 250 MB. If `cms-site/public/assets/video/` is included, it's ~50 MB by itself. Fine.
- `.gitignore` is excluding the legacy `site/` directory and the raw source folders (`journalism/`, `landscape/`, etc.). `git ls-files | head` should not list any of those.

---

## Step 3 — Create the Netlify site

1. Sign in at https://app.netlify.com (or sign up — free).
2. **Add new site** → **Import an existing project**.
3. Choose **GitHub** → authorize → pick the `derousselmedia` repo.
4. Build settings (should auto-detect from `netlify.toml`, but verify):
   - **Base directory**: `cms-site`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `cms-site/dist`
   - **Node version**: 22 (set via env var `NODE_VERSION=22` in `netlify.toml`)
5. Click **Deploy site**. The first deploy takes ~2 minutes (cold npm install).
6. Once deployed, Netlify gives you a URL like `derousselmedia-a1b2c3.netlify.app`. Visit it — confirm the site loads and matches local.

---

## Step 4 — Enable Netlify Identity + Git Gateway

This is the **critical click-path** that unlocks the admin. Without these two toggles, the admin loads but no one can sign in.

Inside the Netlify dashboard, with your site selected:

1. **Site configuration** (left sidebar) → **Identity**.
2. Click **Enable Identity**. (If prompted to choose registration mode, select **Invite only** — Alex shouldn't have public sign-up.)
3. Still under Identity, scroll to **Registration preferences** → confirm **Invite only**.
4. Scroll further to **External providers** — optional, you can add Google/GitHub OAuth here if Alex would rather sign in with Google. Skip if you want plain email/password.
5. Scroll to **Git Gateway** → click **Enable Git Gateway**. This grants Netlify permission to commit to your repo on Alex's behalf via signed JWTs. You'll see "Git Gateway is enabled" with a green dot.

> **If Git Gateway fails to enable**: the connected GitHub account must have admin access to the repo. If you connected with a personal account that doesn't, disconnect & reconnect with one that does (Site configuration → Build & deploy → Continuous deployment → manage GitHub app).

---

## Step 5 — Invite Alex

1. Netlify dashboard → **Identity** tab (top nav, not the sidebar — there's a dedicated top-level tab once Identity is enabled).
2. Click **Invite users** (top right).
3. Enter Alex's email: `derousselmedia@gmail.com`.
4. Click **Send**.

Alex receives an email titled "You've been invited to join …". When he clicks the link, he sets a password and is sent to `<site-url>/admin/`.

You can test the flow yourself first: invite your own email, accept, sign in, add a test photo to Sports, publish, then verify the deploy rebuilds and the photo appears. **Remove the test photo before going live.**

---

## Step 6 — Custom domain (when Alex registers `derousselmedia.com`)

When the domain is registered (Cloudflare, Namecheap, Porkbun — any registrar):

1. Netlify dashboard → **Domain management** → **Add custom domain**.
2. Enter `derousselmedia.com` → confirm.
3. Netlify shows two records to set at the registrar:
   - `A` record `@` → `75.2.60.5` (Netlify's load balancer)
   - `CNAME` record `www` → `<your-site>.netlify.app`
   
   (Exact values shown in Netlify dashboard at the time — use those, not these.)
4. Wait for DNS propagation (1 min to 24 hr; usually <10 min).
5. Once Netlify shows a green ✓ next to the domain, click **HTTPS** → **Verify DNS configuration** → **Provision certificate** (Let's Encrypt, free, auto-renews).
6. In **Site configuration** → **General** → **Site information**, update the primary domain to `derousselmedia.com` (so Netlify redirects `*.netlify.app` → custom domain).

**Update the site URL** in `cms-site/src/content/pages/settings.md` if you wired anything to it; the Decap config already references `https://derousselmedia.com`.

---

## Step 7 — Verify deploy automation

After a domain switch or any change you push to `main`:

- Push a change (e.g., edit `ALEX_ONBOARDING.md` to add your contact info under "Who to contact").
- Netlify dashboard → **Deploys** — you should see a new deploy queued, then building, then green ✓ within 1–2 minutes.

---

## Run locally for development

Two terminals:

```bash
# Terminal 1 — Astro dev server (hot reload)
cd cms-site
npm run dev
# → http://localhost:4321
```

```bash
# Terminal 2 — Decap local backend (so /admin/ works without Netlify Identity)
cd cms-site
npx --yes decap-server
# → serves the proxy that lets /admin/ commit to your local filesystem
```

Then visit `http://localhost:4321/admin/` — Decap will detect the local backend (it sees `local_backend: true` in `config.yml`) and skip the Identity prompt. Changes saved in admin write directly to `cms-site/src/content/*.md` and `cms-site/public/uploads/*` on your local disk.

> Hot reload picks up content changes within ~1 second.

---

## Updating the legacy bulk-image pipeline (rarely needed)

For initial migrations or re-encoding large batches of existing photos, the original Python pipeline still works:

```bash
# From the project root.
# Requires Python 3.12 with Pillow and ffmpeg in PATH.
python scripts/process_images.py
python scripts/process_videos.py
python scripts/finalize_manifest.py
node cms-site/scripts/migrate-content.mjs   # regenerate Astro content from manifest
```

For Alex's day-to-day uploads through the CMS, this is **not** needed. The CMS-uploaded images serve at their original size; the build doesn't re-encode them.

> If at some point the CMS-uploaded photos start hurting Lighthouse, write a Sharp-based Astro integration that processes `/uploads/*` into 3-size sets at build time. That's a future optimization, not blocking.

---

## Where things live

```
Alex Website/
├── .gitignore                  ← excludes site/, node_modules, raw source media
├── .env.example
├── netlify.toml                ← build config + cache headers
├── ALEX_ONBOARDING.md          ← editor guide (give Alex this)
├── DEVELOPER_SETUP.md          ← this file
├── CMS_MIGRATION_REPORT.md     ← what was built, scores, known issues
├── README.md
│
├── site/                       ← LEGACY hand-tuned static site (excluded from git)
│   ...                         ←   kept on disk for reference; replaced by cms-site/
│
├── scripts/                    ← LEGACY Python pipeline (kept; rarely used)
│
├── journalism/, landscape/, …  ← Original source media (excluded from git)
│
└── cms-site/                   ← THE NEW SITE
    ├── astro.config.mjs
    ├── package.json
    ├── tsconfig.json
    ├── public/
    │   ├── admin/              ← Decap admin loader + config.yml
    │   ├── assets/             ← pre-optimized images from the legacy build
    │   ├── uploads/            ← NEW: where Decap commits Alex's uploads
    │   ├── main.js             ← lightbox + hero rotation (vanilla)
    │   ├── favicon.svg, robots.txt, sitemap.xml
    ├── src/
    │   ├── components/         ← Astro components (Hero, Gallery, …)
    │   ├── content/
    │   │   ├── sports/         ← 21 markdown files, one per photo
    │   │   ├── landscape/      ← 7 markdown files
    │   │   ├── misc/           ← 2 markdown files
    │   │   ├── films/          ← 2 markdown files
    │   │   └── pages/          ← about.md + settings.md
    │   ├── content.config.ts   ← typed schemas
    │   ├── layouts/BaseLayout.astro
    │   ├── lib/                ← mosaic algorithm + image path helper
    │   ├── pages/index.astro   ← the single page (composed from collections)
    │   └── styles/main.css     ← verbatim from legacy site
    └── scripts/
        └── migrate-content.mjs ← one-shot legacy → content/ migration (run once)
```

---

## Troubleshooting

### "Failed to load configuration" on the admin page
Decap can't parse `config.yml`. Open `cms-site/public/admin/config.yml` and check for indentation errors. YAML is whitespace-sensitive; 2 spaces per level, no tabs.

### Admin loads but "API: An error occurred" on save
Git Gateway is misconfigured or not enabled. Netlify dashboard → Site configuration → Identity → Git Gateway → ensure green dot. If the connected GitHub account no longer has repo admin, reconnect.

### Deploy fails with "Module not found"
Verify `cms-site/package.json` lists `astro` as a dependency and `cms-site/package-lock.json` is committed. If you added a dep manually, re-run `npm install` locally and commit the new lockfile.

### Deploy succeeds but new uploads 404
Decap writes to `cms-site/public/uploads/` (per `media_folder` in config.yml). If you change the value, the live site won't find the uploaded file at the URL Decap wrote into the markdown. Keep `public_folder: /uploads` matching the `public/uploads` path.

### Lighthouse Performance regresses
Most likely cause: Alex uploaded a very large image (>2 MB) and it's now in the LCP path (e.g., a new hero rotation photo). Run Lighthouse to identify which image; either ask Alex to resize, or add a Sharp integration to process `/uploads/*` at build time.

### CMS overwrites images with the same filename
By default Decap appends a `_N` suffix to duplicate filenames. If Alex re-uploads with the exact same filename, it gets versioned. To force replacement, he can delete the old upload first (under Media library in the admin).

---

## Costs

- **Netlify**: free tier (Starter) covers 100 GB bandwidth/month, 300 build minutes/month. This portfolio uses <5 GB and <30 min/month at typical Alex-update frequency.
- **GitHub**: free tier (private repo, 2 GB).
- **Netlify Identity**: free up to 1,000 active users (we'll have 1–3).
- **Domain registration**: $10–20/year wherever Alex buys.

**Total recurring cost: just the domain.**

---

## What I'd do next

These aren't blockers — they're nice-to-haves for v1.1:

1. **Sharp-based `/uploads/` processing** — small Astro integration (or a Vite plugin) that runs Sharp on every file in `public/uploads/` during build, producing `-sm.webp`, `-md.webp`, `-lg.webp` variants in `cms-site/public/_processed/`. Then update `image-paths.ts` to use them when `hasResponsiveVariants` is false but the file exists in `_processed/`. Restores the full responsive image treatment for CMS uploads without Alex having to do anything.
2. **Long-form video → Cloudinary**: 1080p videos exceed 50 MB and the 50 MB Decap upload cap. The Films collection already accepts YouTube/Vimeo URLs (production Decap can also accept Cloudinary URLs). Document a Cloudinary preset for Alex if he wants self-hosted video.
3. **Sitemap auto-generation**: install `@astrojs/sitemap`, update `astro.config.mjs`, drop the static `public/sitemap.xml`. Free-tier and proper.
4. **Lighthouse CI on PRs** if a team forms.
5. **`netlify dev` deep-link**: the `local_backend: true` flag works without Netlify Identity but doesn't preview as the real admin. For full-fidelity local testing of the auth flow, run `netlify dev` (after `npm i -g netlify-cli`), which mirrors the production Identity + Git Gateway behavior.

---

## Contact

If you (the developer) need to hand this off to another developer later, the key things to know are: it's an Astro 6 project with typed content collections, Decap CMS in `public/admin/`, deployed via Netlify with Git Gateway. Anyone who's seen this pattern before can pick it up in 30 minutes.
