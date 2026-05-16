"""Augment site/asset-manifest.json with video entries."""
import json
from pathlib import Path

ROOT = Path(r"C:\Users\lawnb\Downloads\Alex Website")
MANIFEST = ROOT / "site" / "asset-manifest.json"

data = json.loads(MANIFEST.read_text(encoding="utf-8"))

# Drop any prior videos array to refresh.
data["videos"] = [
    {
        "original": "journalism/06 - Broadcast Journalism Final.mp4",
        "slug": "journalism-reel",
        "category": "journalism",
        "title": "Broadcast Journalism Final",
        "renditions": [
            {"quality": "720p", "file": "assets/video/journalism-reel-720.mp4"},
            {"quality": "1080p", "file": "assets/video/journalism-reel-1080.mp4"},
        ],
        "poster": "assets/video/journalism-reel-poster.jpg",
    },
    {
        "original": "miscellaneous/07 - Adidas Commercial.mp4",
        "slug": "adidas-commercial",
        "category": "commercial",
        "title": "Adidas Commercial",
        "renditions": [
            {"quality": "720p", "file": "assets/video/adidas-commercial-720.mp4"},
            {"quality": "1080p", "file": "assets/video/adidas-commercial-1080.mp4"},
        ],
        "poster": "assets/video/adidas-commercial-poster.jpg",
    },
]

# Summary stats
imgs = data.get("images", [])
data["stats"] = {
    "totalImages": len(imgs),
    "sportsCount": sum(1 for i in imgs if i["category"] == "sports"),
    "landscapeCount": sum(1 for i in imgs if i["category"] == "landscape"),
    "miscCount": sum(1 for i in imgs if i["category"] == "misc"),
    "variantsPerImage": len(next(iter(imgs))["variants"]) * 2 if imgs else 0,  # jpg+webp
}

MANIFEST.write_text(json.dumps(data, indent=2), encoding="utf-8")
print("manifest updated:", MANIFEST)
print(json.dumps(data["stats"], indent=2))
