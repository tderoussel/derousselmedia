"""Transcode the two source videos and extract poster frames."""
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(r"C:\Users\lawnb\Downloads\Alex Website")
OUT = ROOT / "site" / "assets" / "video"
OUT.mkdir(parents=True, exist_ok=True)

FFMPEG = r"C:\Users\lawnb\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe"

VIDEOS = [
    {
        "src": ROOT / "journalism" / "06 - Broadcast Journalism Final.mp4",
        "slug": "journalism-reel",
        "poster_t": "00:00:05",  # 5 seconds in
    },
    {
        "src": ROOT / "miscellaneous" / "07 - Adidas Commercial.mp4",
        "slug": "adidas-commercial",
        "poster_t": "00:00:04",
    },
]


def run(cmd):
    print("$", " ".join(str(c) for c in cmd[:8]), "...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("STDERR:", res.stderr[-1500:])
        raise SystemExit(res.returncode)


def transcode(src: Path, dst: Path, height: int, crf: int, maxrate_k: int, audio_kbps: int = 96):
    if dst.exists() and dst.stat().st_size > 0:
        print(f"skip (exists): {dst.name}")
        return
    # Even width via -2; constrain height; H.264 high profile; web-compatible MOV atom.
    run([
        FFMPEG, "-y", "-i", str(src),
        "-vf", f"scale=-2:{height}",
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", str(crf),
        "-maxrate", f"{maxrate_k}k",
        "-bufsize", f"{maxrate_k * 2}k",
        "-profile:v", "high", "-level", "4.1",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", f"{audio_kbps}k", "-ac", "2",
        "-movflags", "+faststart",
        str(dst),
    ])


def poster(src: Path, dst: Path, t: str):
    if dst.exists() and dst.stat().st_size > 0:
        print(f"skip (exists): {dst.name}")
        return
    run([
        FFMPEG, "-y", "-ss", t, "-i", str(src),
        "-frames:v", "1", "-q:v", "3",
        "-vf", "scale=1920:-2",
        str(dst),
    ])


def main():
    for v in VIDEOS:
        slug = v["slug"]
        src = v["src"]
        poster(src, OUT / f"{slug}-poster.jpg", v["poster_t"])
        # 720p target ≤25MB; CRF 23 with maxrate ~2200k gets close.
        transcode(src, OUT / f"{slug}-720.mp4", 720, crf=23, maxrate_k=2200)
        # 1080p higher-quality fallback for desktop with bandwidth.
        transcode(src, OUT / f"{slug}-1080.mp4", 1080, crf=22, maxrate_k=4500)


if __name__ == "__main__":
    main()
