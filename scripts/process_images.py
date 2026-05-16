"""
Process source photos -> site/assets:
- Filter ._* macOS metadata.
- Rename to kebab-case with category prefix.
- Strip EXIF.
- Generate 3 sizes (sm 800, md 1600, lg 2560) as both .jpg and .webp.
- Write asset-manifest.json mapping original -> new + variants + dimensions.

Idempotent: skips outputs that already exist with non-zero size.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(r"C:\Users\lawnb\Downloads\Alex Website")
OUT = ROOT / "site" / "assets"
SIZES = {"sm": 800, "md": 1600, "lg": 2560}
JPEG_QUALITY = 82
WEBP_QUALITY = 80

# Order is deliberate: existing slugs (sports-01..15) kept stable so URLs don't
# break. Slugs 06, 11, 14 swap their source from .jpeg -> newer .jpg re-edit
# (Alex's revised exports). Slugs 16-21 are new shots appended to the end.
SPORTS_ORDER = [
    "IMG_0026.jpeg",
    "IMG_0062 (1).jpg",
    "IMG_0418 (1).jpg",
    "IMG_0710 (1) (1).jpg",
    "IMG_0725 (1).jpg",
    "IMG_1096.jpg",          # replaced .jpeg
    "IMG_1168 (1).jpg",
    "IMG_1776.jpeg",
    "IMG_2104.jpg",
    "IMG_2181.JPG",
    "IMG_8291.jpg",          # replaced .jpeg
    "IMG_8784 (2).jpg",
    "IMG_8885 2.jpg",
    "IMG_8941.jpg",          # replaced .jpeg
    "IMG_9203.jpg",
    "IMG_0590 (1).jpg",      # new
    "IMG_0691 (1) (1).jpg",  # new
    "IMG_0722.jpg",          # new
    "IMG_0948 (1).jpg",      # new
    "IMG_5899 (1).jpg",      # new
    "IMG_9410 (1).jpg",      # new
]
LANDSCAPE_ORDER = [
    "IMG_0084.jpg",
    "IMG_0142.jpg",
    "IMG_0151 (2).jpg",
    "IMG_0154.JPG",
    "IMG_0768.jpg",
    "IMG_0846.jpg",
    "IMG_0968.jpg",
]
# Misc / personal frames that don't fit Sports or Landscape.
MISC_ORDER = [
    "IMG_1821.JPG",
    "IMG_6502.jpg",
]


def kebab(category: str, idx: int) -> str:
    return f"{category}-{idx:02d}"


def process_one(src: Path, slug: str, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    info = {"original": src.name, "slug": slug, "variants": {}}
    with Image.open(src) as im:
        # Apply EXIF rotation, then strip EXIF.
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGB")
        w0, h0 = im.size
        info["originalWidth"] = w0
        info["originalHeight"] = h0
        info["aspect"] = round(w0 / h0, 4)

        for size_key, target_w in SIZES.items():
            tw = min(target_w, w0)
            th = round(h0 * (tw / w0))
            resized = im.resize((tw, th), Image.LANCZOS)
            jpg_path = out_dir / f"{slug}-{size_key}.jpg"
            webp_path = out_dir / f"{slug}-{size_key}.webp"
            if not jpg_path.exists() or jpg_path.stat().st_size == 0:
                resized.save(jpg_path, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            if not webp_path.exists() or webp_path.stat().st_size == 0:
                resized.save(webp_path, "WEBP", quality=WEBP_QUALITY, method=6)
            info["variants"][size_key] = {
                "width": tw,
                "height": th,
                "jpg": str(jpg_path.relative_to(ROOT / "site")).replace("\\", "/"),
                "webp": str(webp_path.relative_to(ROOT / "site")).replace("\\", "/"),
            }
    return info


def main():
    manifest = {"images": [], "videos": []}
    # Sports
    sports_dir = ROOT / "sports photography"
    for i, name in enumerate(SPORTS_ORDER, start=1):
        src = sports_dir / name
        if not src.exists():
            print(f"missing sports: {name}")
            continue
        slug = kebab("sports", i)
        info = process_one(src, slug, OUT / "sports")
        info["category"] = "sports"
        info["index"] = i
        manifest["images"].append(info)
        print(f"sports/{slug} <- {name} ({info['originalWidth']}x{info['originalHeight']})")

    # Landscape
    landscape_dir = ROOT / "landscape"
    for i, name in enumerate(LANDSCAPE_ORDER, start=1):
        src = landscape_dir / name
        if not src.exists():
            print(f"missing landscape: {name}")
            continue
        slug = kebab("landscape", i)
        info = process_one(src, slug, OUT / "landscape")
        info["category"] = "landscape"
        info["index"] = i
        manifest["images"].append(info)
        print(f"landscape/{slug} <- {name} ({info['originalWidth']}x{info['originalHeight']})")

    # Misc / personal
    misc_dir = ROOT / "miscellaneous"
    for i, name in enumerate(MISC_ORDER, start=1):
        src = misc_dir / name
        if not src.exists():
            print(f"missing misc: {name}")
            continue
        slug = kebab("misc", i)
        info = process_one(src, slug, OUT / "misc")
        info["category"] = "misc"
        info["index"] = i
        manifest["images"].append(info)
        print(f"misc/{slug} <- {name} ({info['originalWidth']}x{info['originalHeight']})")

    # Write manifest.
    (ROOT / "site" / "asset-manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    print(f"\nManifest: {len(manifest['images'])} images written.")


if __name__ == "__main__":
    main()
