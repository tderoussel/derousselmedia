"""
Screenshot the running site at 4 breakpoints + full-page captures for review.
Writes to BUILD_REPORT_assets/.
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = "http://localhost:5179/"
OUT = Path(r"C:\Users\lawnb\Downloads\Alex Website\BUILD_REPORT_assets")
OUT.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    (375, 812, "375"),
    (768, 1024, "768"),
    (1280, 800, "1280"),
    (1920, 1080, "1920"),
]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for w, h, label in VIEWPORTS:
            ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
            page = ctx.new_page()
            page.goto(URL, wait_until="networkidle", timeout=45000)
            page.wait_for_timeout(1200)
            # Top-of-page screenshot first (above the fold, no scroll triggered)
            top_path = OUT / f"site-{label}-top.jpg"
            page.screenshot(path=str(top_path), full_page=False, quality=80, type="jpeg")
            # Scroll through the page so IntersectionObserver fires + lazy imgs load.
            page.evaluate("""async () => {
              const dh = document.documentElement.scrollHeight;
              const step = Math.max(window.innerHeight * 0.7, 600);
              for (let y = 0; y <= dh; y += step) {
                window.scrollTo(0, y);
                await new Promise(r => setTimeout(r, 220));
              }
              window.scrollTo(0, 0);
              await new Promise(r => setTimeout(r, 400));
            }""")
            page.wait_for_timeout(900)
            # Full-page screenshot
            full_path = OUT / f"site-{label}-full.jpg"
            page.screenshot(path=str(full_path), full_page=True, quality=70, type="jpeg")
            print(f"[{label}] {top_path.stat().st_size//1024}KB top · {full_path.stat().st_size//1024}KB full")
            ctx.close()
        browser.close()


if __name__ == "__main__":
    main()
