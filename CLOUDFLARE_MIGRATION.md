# Moving derousselmedia.com from Netlify → Cloudflare Pages

**Why:** the Netlify Free plan suspended the site for exceeding its 100 GB/month
bandwidth (`503 usage_exceeded`). Cloudflare Pages has **unlimited bandwidth on
the free plan**, which suits a photo/video portfolio.

**What's already done in this repo** (committed):
- The Astro site is pure-static and already builds for Cloudflare with no code changes.
- `cms-site/public/_headers` — caching/content-type rules (replaces `netlify.toml`).
- `cms-site/.node-version` — pins Node 22.12.0 so Cloudflare builds with the right version.
- The CMS at `/admin` was switched from **Decap + Netlify Identity** to
  **Sveltia CMS + GitHub login** (`cms-site/public/admin/`). Same fields, same
  content files — only the login method changes.

You do the four browser steps below. Nothing here touches the live site until
**Step 3 (DNS)**, so you can take your time on Steps 1–2.

---

## Step 1 — Put the site on Cloudflare Pages

1. Go to <https://dash.cloudflare.com> and sign up / log in (free).
2. **Workers & Pages → Create → Pages → Connect to Git.** Authorize GitHub and
   pick the repo **`tderoussel/derousselmedia`**.
3. Build settings — set these **exactly**:
   | Field | Value |
   |---|---|
   | Production branch | `main` |
   | Framework preset | `Astro` (or `None`) |
   | **Root directory** | **`cms-site`**  ← important: the app lives in this subfolder |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Environment variable (optional) | `NODE_VERSION` = `22.12.0` (already pinned by `.node-version`) |
4. **Save and Deploy.** When it finishes you'll get a URL like
   `https://derousselmedia.pages.dev`. Open it — the site should load fully.
   **At this point the site is back online** (on the pages.dev URL).

---

## Step 2 — Restore the `/admin` editor login (Sveltia + GitHub)

The CMS now logs in with GitHub instead of Netlify. This needs a tiny auth
helper (a Cloudflare Worker) and a GitHub OAuth app. One-time setup.

> **Heads up:** whoever edits the site (Alex) must have a **GitHub account with
> write access** to `tderoussel/derousselmedia`. Add them under
> **GitHub repo → Settings → Collaborators**.

1. **Create a GitHub OAuth app:** GitHub → **Settings → Developer settings →
   OAuth Apps → New OAuth App.**
   - Application name: `DeRoussel Media CMS`
   - Homepage URL: `https://derousselmedia.com`
   - Authorization callback URL: `https://AUTH-WORKER-URL/callback`
     *(you'll get the real worker URL in the next step — come back and fill this in)*
   - Register, then copy the **Client ID** and generate + copy a **Client Secret**.

2. **Deploy the auth Worker:** open <https://github.com/sveltia/sveltia-cms-auth>
   and use its **"Deploy to Cloudflare"** button (or `npx wrangler deploy`).
   Set these Worker variables/secrets:
   - `GITHUB_CLIENT_ID` = the Client ID from step 1
   - `GITHUB_CLIENT_SECRET` = the Client Secret from step 1
   - `ALLOWED_DOMAINS` = `derousselmedia.com,derousselmedia.pages.dev`

   After it deploys, copy the Worker URL, e.g.
   `https://sveltia-cms-auth.YOURNAME.workers.dev`.
   Go back to the GitHub OAuth app and set the callback to
   `https://sveltia-cms-auth.YOURNAME.workers.dev/callback`.

3. **Point the CMS at the Worker:** edit **`cms-site/public/admin/config.yml`**,
   line with `base_url:`, and replace the placeholder with your Worker URL
   (no trailing slash). Commit + push — Cloudflare auto-rebuilds.

4. Visit `https://derousselmedia.com/admin/` (or the pages.dev `/admin/`),
   click **Sign in with GitHub**, authorize, and confirm you can edit + save.

> Quick alternative if you'd rather skip the Worker for now: Sveltia can also log
> in with a GitHub **Personal Access Token**. Less smooth for a non-technical
> editor, but zero infrastructure. Ask and I'll document it.

---

## Step 3 — Move the domain to Cloudflare (this is the cutover)

`derousselmedia.com` currently points at Netlify. Easiest reliable path:

1. In Cloudflare: **Add a site → `derousselmedia.com`** (free plan). Cloudflare
   scans your existing DNS and gives you **two nameservers**.
2. At your **domain registrar** (wherever the domain was bought), replace the
   current nameservers with Cloudflare's two. (Propagation: minutes–hours.)
3. Back in the **Pages project → Custom domains → Set up a custom domain** → add
   `derousselmedia.com` **and** `www.derousselmedia.com`. Cloudflare creates the
   records and provisions SSL automatically.
4. Once `https://derousselmedia.com` serves from Cloudflare (check it loads), you're live.

*Prefer not to move nameservers?* You can instead keep DNS where it is and add the
CNAME records Cloudflare shows for the custom domain — but apex domains make this
fiddly, so moving nameservers is the clean option. Ask if you want the alt path.

---

## Step 4 — Decommission Netlify (only after Step 3 is confirmed working)

1. Netlify → site `derousselmedia` → **Domain management → remove the custom
   domain** (so it stops claiming `derousselmedia.com`).
2. Optional: **Site settings → Build & deploy → stop auto-publishing** (or delete
   the Netlify site) so you don't get duplicate builds on every CMS commit.
3. You can keep the Netlify Free account; once the domain is off it, the bandwidth
   suspension is irrelevant.

---

## Notes / gotchas

- **Per-file size limit:** Cloudflare Pages rejects any single file over **25 MiB**.
  Your journalism reel is **24.6 MB** — fine, but close. If you re-upload a bigger
  video through the CMS, host it on YouTube/Vimeo and paste the URL instead (the
  video field already supports that).
- **`netlify.toml`** is left in the repo as a fallback (Cloudflare ignores it). If
  you ever want to return to Netlify on a paid plan, it still works — but you'd
  need to switch the CMS `backend` back to `git-gateway` + Netlify Identity.
- **Build minutes:** Cloudflare free allows 500 builds/month. Every CMS save
  triggers one build (same as Netlify today); you're well within that.
