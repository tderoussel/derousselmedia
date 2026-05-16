# DeRoussel Media — How to update your site

Hi Alex. Welcome to your portfolio's content manager. This guide covers everything you need to know — no coding, no scary terminal, no calling for help every time you want to swap a photo.

---

## How it works (in one paragraph)

Your site has two parts: the **public site** (`derousselmedia.com`) and a hidden **content manager** (`derousselmedia.com/admin/`) that only you can sign into. When you add or change photos in the content manager and click **Publish**, the site quietly rebuilds itself in the background — about 30 seconds later, the public site has the new content. That's it. You don't push buttons, run commands, or wait for anything else.

---

## First-time setup (one time only)

You'll get an email from Netlify titled something like **"You've been invited to join derousselmedia.netlify.app"**. (If you've already moved your custom domain over, the URL might just say `derousselmedia.com`.)

1. **Click the "Accept the invite" button** in the email.
2. A page opens asking you to **set a password**. Use a strong one — write it down in your password manager.
3. After setting your password, you'll be sent to `derousselmedia.com/admin/` automatically. Bookmark this URL.
4. **Sign in** with your email + the password you just set. You should land on a page that lists your collections: Sports photos, Landscape photos, Miscellaneous photos, Films & reels, Pages.

You're done with setup. From now on, just go to **derousselmedia.com/admin/** when you want to make changes.

> If the email never arrives, check spam. If it's still missing, contact your developer (see "Who to contact" at the bottom of this doc) and they can resend the invite.

---

## The big picture: what each collection does

| Collection | What's inside | Where it shows up |
|---|---|---|
| **Sports photos** | Your sports photography | The "Sports Photography" section |
| **Landscape photos** | Your landscape work | The "Landscape" section |
| **Miscellaneous photos** | Anything that doesn't fit | The "Miscellaneous" section |
| **Films & reels** | Videos (journalism reel, commercial) | The two video sections |
| **Pages → About page** | Your bio and details | The About section |
| **Pages → Site settings** | Tagline, hero photos, contact info, IG link | Everywhere those things appear |

---

## Add a photo to Sports (the most common task)

1. **Sign in** at `derousselmedia.com/admin/`.
2. In the left sidebar, click **Sports photos**.
3. Click the **"New Sports photo"** button (top right).
4. **Drag your photo onto the "Photo" upload area**, or click and pick a file. JPEG, PNG, or WebP. Up to 20 MB. (For full-res phone photos this is fine; for a 50-MP DSLR RAW conversion, you'd want to export at JPEG-quality 85, which keeps it well under the limit.)
5. **Fill in "Description (alt text)"** — describe what's in the photo in one sentence. Example: *"Long-jumper airborne over the runway, neon-yellow spikes catching the late-day sun."* This shows up for screen readers and helps Google understand the photo.
6. **Caption** is optional and shows up in the lightbox under the photo.
7. **Emphasis** — leave this on **Auto** unless you really want this photo to be a full-bleed letterbox (use "Full-bleed letterbox" sparingly — once every 5–8 photos at most), or you specifically want it tall.
8. **Order** — lower numbers appear first. The existing 21 photos use numbers 10, 20, 30, … 210. If you want a new photo near the top, set order to **5** or **15**. To put it at the end, leave the default **100** (or use any number larger than 210).
9. Click **Publish** (top right). You'll see a green confirmation.

About 30 seconds later, refresh `derousselmedia.com` and your new photo is live.

> **Tip on ordering:** Use multiples of 10 (10, 20, 30, …). That way you can always slot a new photo in between two existing ones without re-numbering everything — e.g., set order to **25** to land between numbers 20 and 30.

---

## Add a photo to Landscape or Miscellaneous

Exactly the same as Sports — pick the matching collection in the left sidebar.

---

## Add a video — local file (under 50 MB)

If your video is **under 50 MB** (typical for a short reel exported at 720p H.264), you can upload it directly.

1. Click **Films & reels** in the sidebar → **"New Film"**.
2. **Title**: internal name, e.g. "2025 Hockey Reel".
3. **Section anchor**: choose which slot to replace —
   - "Journalism (top film slot)" replaces the broadcast journalism reel
   - "Commercial (bottom film slot)" replaces the Adidas commercial spot
   
   (You can only have ONE video per slot. To add a third video later, ask your developer to add another slot.)
4. **Heading parts** (eyebrow, prefix, italic word, suffix): control how the big editorial title above the video reads. Example: italic word = "Broadcast", suffix = "Reel" → renders as *Broadcast* Reel.
5. **Description**: one short paragraph shown above the video.
6. **Video URL or upload**: click **Choose an Existing Media** or upload a new MP4.
7. **Poster image**: a still frame to show before the video plays. Upload a JPEG.
8. Click **Publish**.

---

## Add a video — YouTube or Vimeo (any size)

If your video is **larger than 50 MB**, upload it to YouTube (Unlisted is fine — only people with the link can see it) or Vimeo first, then paste the URL.

1. Upload your video to YouTube/Vimeo. Set visibility to **Unlisted** if you want it private to viewers who don't have the URL.
2. Copy the standard share URL — for YouTube either form works:
   - `https://www.youtube.com/watch?v=abc123XYZ`
   - `https://youtu.be/abc123XYZ`
   - For Vimeo: `https://vimeo.com/123456789`
3. Back in the admin: **Films & reels** → **New Film**.
4. Fill in title, section, heading parts, description as above.
5. In the **Video URL or upload** field, **paste the YouTube/Vimeo URL instead of uploading a file**. (The field is labeled "file" but it accepts a URL string too — type or paste it in.)
6. You don't need a poster image — YouTube/Vimeo provide their own.
7. Click **Publish**.

The site automatically detects YouTube/Vimeo URLs and embeds the player. (Privacy-friendly: uses youtube-nocookie.com and Vimeo's dnt=1 flag.)

---

## Reorder photos

The site is sorted by the **Order** number on each photo (lowest first).

To move a photo:

1. Open it in the admin.
2. Change its **Order** number.
3. Click **Publish**.

Example: to move a photo to position 4 when positions 30 and 40 are already taken, set its order to **35**.

> If you ever need to reorder a lot of photos at once, ask the developer for help — they can do it in bulk.

---

## Remove a photo

1. Open the photo in the admin.
2. Scroll to the bottom.
3. Click **Delete**.
4. Confirm.

The photo's markdown file and the image file both get removed from the site within ~30 seconds.

> **Be careful — there's no Undo button.** If you delete a photo by accident, see "If something goes wrong" below.

---

## Edit your bio

1. Sidebar: **Pages** → **About page**.
2. Edit the bio paragraph and the right-column details (Disciplines, Based in, Available for).
3. Click **Publish**.

---

## Update tagline, hero rotation, contact info, Instagram link

1. Sidebar: **Pages** → **Site settings**.
2. Edit the field you want — common ones:
   - **Hero tagline** (one-line under the big name)
   - **Hero rotation images** (the photos that fade through behind the hero — paste paths like `/uploads/photo.jpg` or `/assets/sports/sports-13-md.jpg`)
   - **Contact email**, **phone**, **Instagram URL**
3. Click **Publish**.

To get an Instagram URL: open your profile on instagram.com and copy the URL bar — e.g. `https://www.instagram.com/derousselmedia/`.

---

## What happens after you hit Publish

Step by step, behind the scenes:

1. The content manager **commits** your changes to the site's source.
2. **Netlify notices** the change and starts rebuilding the site (about 20 seconds).
3. The new version replaces the old one — **typically live in 30–45 seconds total**.
4. You can refresh `derousselmedia.com` and see your changes.

If you don't see them after a minute, do a **hard refresh** (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows) to bypass your browser's cache.

---

## If something goes wrong

### The site looks broken after I published a change

This is **rare** but if it happens, you can roll back to a previous version:

1. Sign in to **netlify.com** with the same email you use for the content manager.
2. Click your site → **Deploys** in the top nav.
3. Find the most recent green ✓ deploy from **before** your problematic change.
4. Click it → **Publish deploy** (top right).

The site goes back to that version in seconds. Then contact your developer.

### I accidentally deleted a photo or video

Contact your developer with the photo's filename or description. Every change is tracked in git, so they can recover it in a few minutes.

### I can't sign in to the admin

- Make sure you're on `derousselmedia.com/admin/` (not `.com/admin` without the slash, and not `.com` without `/admin/`).
- Try the **"Forgot password?"** link on the sign-in screen.
- Clear your browser cookies for `derousselmedia.com` and try again.
- If still stuck, contact your developer to resend the invite.

### Uploads fail or hang

- Confirm the file is **under 20 MB for photos, 50 MB for videos**.
- Photos that are very wide (over 6000 px) can take a moment to upload — wait 30 seconds before re-trying.
- If your internet is flaky, try again on a better connection.
- For videos larger than 50 MB, use the **YouTube/Vimeo** route instead (see above).

### "Publish" button is greyed out

A required field is missing (most often: **alt text** on a photo). Scroll up — the missing field will have a red highlight. Fill it in and try again.

---

## Common questions

**Can I preview before publishing?**
Decap shows a side-by-side preview as you edit, but the live site only updates when you click Publish.

**Can I have multiple admin users (e.g., an assistant)?**
Yes. Ask your developer to invite anyone else — Netlify Identity supports unlimited users on the free tier.

**Will publishing many photos at once slow the site down?**
Each save triggers a rebuild. If you're adding 10 photos in one session, batch them — fill out all 10, then publish each one. Netlify deduplicates rapid changes so they typically all roll up into one rebuild.

**Can I undo a published change?**
Yes — the "rollback" steps under "If something goes wrong" handle this.

**Does the URL `derousselmedia.com/admin/` show up on Google?**
No. The admin page has `robots: noindex` and Netlify Identity blocks unauthenticated users from doing anything useful.

**Is there a mobile app?**
The admin works in a mobile browser (Safari on iOS, Chrome on Android), though drag-and-drop uploads are easier on a desktop.

---

## Who to contact

Your developer set this up and is the right person to email if you hit a wall:

- **Your developer's contact info**: (your developer should fill this in for you)

Save this guide. The link is `derousselmedia.com/ALEX_ONBOARDING.md` (or whatever your developer set up).
