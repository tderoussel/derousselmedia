"""Capture screenshots + style facts from the three reference sites."""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(r"C:\Users\lawnb\Downloads\Alex Website\BUILD_REPORT_assets\refs")
OUT.mkdir(parents=True, exist_ok=True)

SITES = [
    ("larosa", "https://www.antlarosa.com/?utm_content=link_in_bio&utm_source=ig&utm_medium=social"),
    ("guzy", "https://www.josephguzy.com/?utm_source=ig&utm_medium=social&utm_content=link_in_bio"),
    ("readymag", "https://readymag.website/u899877748/4339331/?utm_source=ig&utm_medium=social&utm_content=link_in_bio"),
]

# Capture facts about typography, colors, structure via injected JS.
PROBE = r"""
() => {
    const facts = { url: location.href, title: document.title };
    const body = document.body;
    const html = document.documentElement;
    facts.bodyBg = getComputedStyle(body).backgroundColor;
    facts.htmlBg = getComputedStyle(html).backgroundColor;
    facts.bodyColor = getComputedStyle(body).color;
    facts.bodyFontFamily = getComputedStyle(body).fontFamily;
    facts.bodyFontSize = getComputedStyle(body).fontSize;
    // Headings
    const heads = [];
    document.querySelectorAll('h1,h2,h3').forEach(h => {
        const cs = getComputedStyle(h);
        heads.push({
            tag: h.tagName,
            text: (h.innerText || '').slice(0, 80),
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            letterSpacing: cs.letterSpacing,
            textTransform: cs.textTransform,
            color: cs.color,
        });
    });
    facts.headings = heads.slice(0, 20);
    // Distinct font-families used
    const families = new Set();
    document.querySelectorAll('*').forEach(el => {
        families.add(getComputedStyle(el).fontFamily);
    });
    facts.fontFamilies = Array.from(families).slice(0, 25);
    // Distinct background colors (rough)
    const bgs = new Set();
    document.querySelectorAll('section, div, header, nav, footer, main, article').forEach(el => {
        const c = getComputedStyle(el).backgroundColor;
        if (c && c !== 'rgba(0, 0, 0, 0)') bgs.add(c);
    });
    facts.backgrounds = Array.from(bgs).slice(0, 25);
    // Distinct text colors
    const colors = new Set();
    document.querySelectorAll('*').forEach(el => colors.add(getComputedStyle(el).color));
    facts.textColors = Array.from(colors).slice(0, 25);
    // Page dimensions
    facts.scrollHeight = document.documentElement.scrollHeight;
    facts.viewportW = window.innerWidth;
    facts.viewportH = window.innerHeight;
    // Nav text content
    const nav = document.querySelector('nav, header');
    facts.navText = nav ? (nav.innerText || '').slice(0, 400) : '';
    // First few image srcs
    const imgs = [];
    document.querySelectorAll('img').forEach(img => {
        if (img.src) imgs.push({src: img.src.slice(0, 200), w: img.naturalWidth, h: img.naturalHeight, alt: img.alt});
    });
    facts.images = imgs.slice(0, 10);
    return facts;
}
"""

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for slug, url in SITES:
            for w, h, label in [(1440, 900, "desktop"), (390, 844, "mobile")]:
                ctx = browser.new_context(viewport={"width": w, "height": h}, user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15")
                page = ctx.new_page()
                try:
                    page.goto(url, wait_until="networkidle", timeout=45000)
                except Exception as e:
                    print(f"[{slug} {label}] timeout: {e}; retrying domcontentloaded")
                    try:
                        page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    except Exception as e2:
                        print(f"[{slug} {label}] failed: {e2}")
                        ctx.close()
                        continue
                page.wait_for_timeout(3500)
                # Top-of-page screenshot
                top_path = OUT / f"{slug}-{label}-top.jpg"
                page.screenshot(path=str(top_path), full_page=False, quality=75, type="jpeg")
                # Full-page screenshot
                full_path = OUT / f"{slug}-{label}-full.jpg"
                try:
                    page.screenshot(path=str(full_path), full_page=True, quality=70, type="jpeg")
                except Exception as e:
                    print(f"[{slug} {label}] full-page screenshot failed: {e}")
                # Style probe (desktop only)
                if label == "desktop":
                    try:
                        facts = page.evaluate(PROBE)
                        import json
                        (OUT / f"{slug}-facts.json").write_text(json.dumps(facts, indent=2, default=str), encoding="utf-8")
                    except Exception as e:
                        print(f"[{slug}] probe failed: {e}")
                print(f"[{slug} {label}] captured ({top_path.stat().st_size//1024}KB top)")
                ctx.close()
        browser.close()

if __name__ == "__main__":
    main()
