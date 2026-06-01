# derousselmedia.com — hosting & CMS setup (Cloudflare)

This documents how the site is hosted and published after migrating off Netlify
(which suspended the site for exceeding its free-tier bandwidth). Done 2026-06-01.

## Hosting
- **Cloudflare Pages**, project **`derousselmedia`**, account `7b91bb41c7f61f8223551bd16736954d`.
- It's a **direct-upload** project (not Git-integrated), published by a GitHub Action.
- Free plan = **unlimited bandwidth** (the reason for the move).

## Auto-deploy
- **`.github/workflows/deploy.yml`** runs on every push to `main` (including the
  commits the CMS makes). It builds `cms-site/` and runs `wrangler pages deploy dist`.
- Needs the GitHub repo secret **`CLOUDFLARE_API_TOKEN`** (a Cloudflare token with
  *Account → Cloudflare Pages → Edit*). Account ID is hard-coded in the workflow.

## Domain / DNS (managed at GoDaddy — nameservers unchanged)
- **`www.derousselmedia.com`** → CNAME → `derousselmedia.pages.dev` (Cloudflare issues SSL).
- **`derousselmedia.com`** (apex) → GoDaddy **Forwarding** (301) → `https://www.derousselmedia.com`.
- Both are registered as **custom domains** on the Pages project.
- No MX/email on the domain, so DNS changes don't affect email.

## CMS (`/admin`)
- **Sveltia CMS** (drop-in replacement for Decap; reads the same `config.yml`).
- Backend: **GitHub**, authenticated by a Cloudflare Worker:
  **`https://sveltia-cms-auth.derousselmedia.workers.dev`** (set as `backend.base_url`).
- Worker secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS`.
- GitHub OAuth app: **"DeRoussel Media CMS"** (client id `Ov23li8VOAUp19KTd1c4`),
  callback `https://sveltia-cms-auth.derousselmedia.workers.dev/callback`.
- **Editors must have a GitHub account with write access** to `tderoussel/derousselmedia`
  (add under repo → Settings → Collaborators). This replaced Netlify Identity.

## ⚠️ Important operational note
The **Cloudflare dashboard does not render under browser automation** (its own bot
protection blocks it). Manage Cloudflare here via the **`wrangler` CLI** and the
**REST API** instead. GitHub and GoDaddy dashboards work fine.

## Loose ends / cleanup
- The old **Netlify** site still exists (suspended). It no longer serves the domain;
  delete it when convenient to avoid confusion.
- Per-file limit on Cloudflare Pages is **25 MiB** — the journalism reel (24.6 MB) is
  close; host any larger video on YouTube/Vimeo (the CMS video field accepts URLs).
- The `netlify.toml` is retained only as a fallback record; Cloudflare ignores it.
