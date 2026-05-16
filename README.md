# DeRoussel Media

Personal portfolio for **Alex DeRoussel** (videographer / photographer / broadcast journalist).
The site now ships with a friendly web admin so Alex can update photos and videos without anyone touching code.

| | |
|---|---|
| Live site (when deployed) | `https://derousselmedia.com` |
| Admin (when deployed) | `https://derousselmedia.com/admin/` |
| Stack | Astro 6 + Decap CMS 3 + Netlify Identity / Git Gateway + Netlify hosting |

---

## Pick your doc

| If you are… | Read this |
|---|---|
| **Alex** | [ALEX_ONBOARDING.md](./ALEX_ONBOARDING.md) — plain-English guide to adding photos, videos, and editing copy. |
| **The developer setting up Netlify + GitHub** | [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) — full runbook. |
| **The developer wondering what changed in the migration** | [CMS_MIGRATION_REPORT.md](./CMS_MIGRATION_REPORT.md) — what was built, what was skipped, Lighthouse scores, open questions. |

---

## Quick start (local dev)

```bash
cd cms-site
npm install
npm run build
npx --yes serve dist -l 5180   # open http://localhost:5180
```

For the admin UI locally, see DEVELOPER_SETUP.md → "Run locally for development".

---

## Repo layout (top level)

```
.
├── cms-site/                   ← the new Astro site (deploy this)
├── site/                       ← legacy hand-tuned static site (kept for reference; excluded from git)
├── scripts/                    ← legacy Python image/video pipeline (kept; rarely used)
├── journalism/, landscape/, …  ← original raw source media (excluded from git)
├── netlify.toml                ← Netlify build config
├── .gitignore
├── ALEX_ONBOARDING.md
├── DEVELOPER_SETUP.md
├── CMS_MIGRATION_REPORT.md
├── BUILD_REPORT.md             ← original build report (legacy reference)
└── README.md
```
