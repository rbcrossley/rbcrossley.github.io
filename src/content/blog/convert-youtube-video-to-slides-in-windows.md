---
title: How to convert youtube videot to slides pdf in windows?
description: A guide that helps a student get pdf slides of youtube videos using ffmpeg, python, and yt-dlp
date: 2026-10-20
author: BerojgarEngineer
image: /images/blog/youtube-to-slides.png
tags: ["video to slides", "youtube video converted to slides for free", "study hack to watch video faster", "study plan"]
categories: ["devops"]
draft: false
---


As a student sometimes we have hours of videos to watch. There is no such video where 100% of the time in the video, useful content is being delivered. Most people who make videos in youtube do not provide the slides.

So much of our time gets wasted in watching the videos.

To fix this problem, I have written few scripts to download youtube videos and convert them to slides.

This is how this pipeline works:

- You insert URLs of youtube videos in a file.
- You execute the script.
- Within some time, the slides will be ready.

# Prerequisites
- have windows 10
- install git bash
- install yt-dlp
- install ffmpeg
- install python and pip install img2pdf

I made a folder named video_to_slides (anywhere is fine). It looks like this.

```
-rwxr-xr-x 1 User 197121 2.1K Sep 18 20:31 download_and_convert.sh*
-rwxr-xr-x 1 User 197121  12K Sep 27 09:10 batch_video_to_pdf.py*
-rwxr-xr-x 1 User 197121 2.7K Oct  3 12:13 video_to_pdf.py*
-rw-r--r-- 1 User 197121  270 Oct 20 12:56 urls.txt
-rw-r--r-- 1 User 197121 1.7K Oct 20 13:06 www.youtube.com_cookies.txt
drwxr-xr-x 1 User 197121    0 Oct 20 13:06 pdfs/
drwxr-xr-x 1 User 197121    0 Oct 20 13:13 downloads/
```

All you have to do is to download the script files and paste it in your laptop.


```bash
download_and_convert.sh

#!/usr/bin/env bash
set -euo pipefail

# Directory containing this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URLS_FILE="$SCRIPT_DIR/urls.txt"
DOWNLOAD_DIR="$SCRIPT_DIR/downloads"
OUTPUT_DIR="$SCRIPT_DIR/pdfs"

mkdir -p "$DOWNLOAD_DIR" "$OUTPUT_DIR"

if [[ ! -f "$URLS_FILE" ]]; then
    echo "ERROR: urls.txt not found."
    exit 1
fi

while IFS= read -r url || [[ -n "$url" ]]; do
    # Remove leading/trailing whitespace
    url="$(echo "$url" | xargs)"

    # Skip blank lines and comments
    [[ -z "$url" || "$url" == \#* ]] && continue

    echo
    echo "================================================="
    echo "Processing:"
    echo "$url"
    echo "================================================="

    # Get video ID (using exported cookies.txt)
    if ! video_id=$(yt-dlp \
        --cookies "$SCRIPT_DIR/www.youtube.com_cookies.txt" \
        --no-playlist \
        --get-id "$url"); then
        echo "Failed to obtain video ID."
        continue
    fi
    echo "Video ID: $video_id"

    output_template="$DOWNLOAD_DIR/${video_id}.%(ext)s"

    echo "Downloading..."
    if ! yt-dlp \
        --cookies "$SCRIPT_DIR/www.youtube.com_cookies.txt" \
        --no-playlist \
        -f "bv*+ba/b" \
        --merge-output-format mp4 \
        -o "$output_template" \
        "$url"; then
        echo "Download failed."
        continue
    fi

    video_path="$DOWNLOAD_DIR/${video_id}.mp4"
    if [[ ! -f "$video_path" ]]; then
        video_path=$(find "$DOWNLOAD_DIR" -maxdepth 1 -type f -name "${video_id}.*" | head -n 1)
    fi

    if [[ -z "$video_path" || ! -f "$video_path" ]]; then
        echo "Downloaded file not found."
        continue
    fi

    echo "Downloaded:"
    echo "$video_path"

    echo "Converting to PDF..."
    if ! python video_to_pdf.py "$video_path" --output-dir "$OUTPUT_DIR"; then
        echo "PDF conversion failed."
        continue
    fi

    echo "Finished."
done < "$URLS_FILE"

echo
echo "======================================"
echo "All done!"
echo "PDFs saved in:"
echo "$OUTPUT_DIR"
echo "======================================"
```

This is just the wrapper script. The core script is written in Python. By the way, I did not write it myself. I used Claude to write it.

```python
#!/usr/bin/env python3
"""
batch_video_to_pdf.py

Turns every video in a folder into a PDF, one page per frame taken every
30 seconds (configurable). Videos that already have a PDF are skipped, so you
can drop new videos into downloads/ and just run it again.

Needs: ffmpeg + ffprobe on PATH, and `pip install img2pdf` (Pillow is used as
a fallback if img2pdf is missing).

Usage (run from anywhere; default folders are next to this script):
    python batch_video_to_pdf.py                      # all videos in downloads/ -> pdfs/
    python batch_video_to_pdf.py --interval 20        # a frame every 20 s instead
    python batch_video_to_pdf.py "D:/some/other/folder"
    python batch_video_to_pdf.py "downloads/Lecture-03 ....mp4"   # just one video
    python batch_video_to_pdf.py --overwrite          # rebuild PDFs that already exist
    python batch_video_to_pdf.py --skip-duplicates    # drop pages identical to the previous one
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
VIDEO_EXTS = {".mp4", ".mkv", ".webm", ".mov", ".avi", ".m4v", ".flv", ".wmv", ".ts", ".mpg", ".mpeg"}


# --------------------------------------------------------------------------- helpers

def fmt_time(seconds: float) -> str:
    seconds = int(round(seconds))
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def check_tools():
    missing = [t for t in ("ffmpeg", "ffprobe") if shutil.which(t) is None]
    if missing:
        sys.exit(f"Error: {', '.join(missing)} not found on PATH. Install ffmpeg and add its bin folder to PATH.")


def collect_videos(inputs):
    """Expand the given files/folders into a sorted list of video files."""
    videos = []
    for raw in inputs:
        p = Path(raw).expanduser()
        if not p.is_absolute() and not p.exists():
            # allow paths relative to the script folder too (e.g. "downloads")
            alt = SCRIPT_DIR / p
            if alt.exists():
                p = alt
        if p.is_dir():
            videos += [f for f in p.iterdir() if f.is_file() and f.suffix.lower() in VIDEO_EXTS]
        elif p.is_file():
            videos.append(p)
        else:
            print(f"Warning: not found, skipping: {raw}")
    # de-duplicate, natural-ish sort by name (case-insensitive)
    seen, out = set(), []
    for v in sorted(videos, key=lambda x: x.name.lower()):
        key = str(v.resolve()).lower()
        if key not in seen:
            seen.add(key)
            out.append(v.resolve())
    return out


def video_duration(video: Path):
    """Duration in seconds via ffprobe, or None if it can't be read."""
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
           "-of", "default=noprint_wrappers=1:nokey=1", str(video)]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout.strip()
        d = float(out)
        return d if d > 0 else None
    except (subprocess.CalledProcessError, ValueError):
        return None


# --------------------------------------------------------------------------- frame extraction

def grab_frame(video: Path, t: float, out_file: Path, quality: int) -> bool:
    """Seek straight to time t and save a single frame (fast: no full decode)."""
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
           "-ss", f"{t:.3f}", "-i", str(video),
           "-frames:v", "1", "-an", "-sn", "-q:v", str(quality), "-y", str(out_file)]
    subprocess.run(cmd, capture_output=True)
    return out_file.exists() and out_file.stat().st_size > 0


def extract_frames_seek(video, duration, interval, frames_dir, quality, workers):
    times = []
    t = 0.0
    while t < duration - 0.5:          # skip a seek that would land past the last frame
        times.append(t)
        t += interval
    total = len(times)
    done = 0
    results = [None] * total

    def job(i):
        f = frames_dir / f"frame_{i:05d}.jpg"
        return i, (f if grab_frame(video, times[i], f, quality) else None)

    pool = ThreadPoolExecutor(max_workers=workers)
    try:
        for i, f in pool.map(job, range(total)):
            results[i] = f
            done += 1
            print(f"\r    frames {done}/{total}", end="", flush=True)
    finally:
        pool.shutdown(wait=True, cancel_futures=True)   # Ctrl+C stops promptly
    print()
    return [(f, times[i]) for i, f in enumerate(results) if f is not None]


def extract_frames_filter(video, interval, frames_dir, quality):
    """Fallback when the duration is unknown: decode the whole video with the fps filter."""
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-stats", "-nostdin",
           "-i", str(video), "-vf", f"fps=1/{interval}", "-an", "-sn",
           "-q:v", str(quality), "-y", str(frames_dir / "frame_%05d.jpg")]
    subprocess.run(cmd, check=True)
    frames = sorted(frames_dir.glob("frame_*.jpg"))
    return [(f, i * interval) for i, f in enumerate(frames)]


# --------------------------------------------------------------------------- duplicate filter

def drop_duplicates(frames, threshold):
    """Remove frames that look the same as the last kept one (static slides).
    Tested on a Teams recording: repeated pages score under 1%, a scrolled or
    changed page 4%+, so the 1.5% default ignores things like people joining."""
    from PIL import Image, ImageChops

    kept, last = [], None
    for f, t in frames:
        with Image.open(f) as im:
            small = im.convert("L").resize((96, 54))
        if last is not None:
            hist = ImageChops.difference(small, last).histogram()
            changed = sum(hist[25:]) / (96 * 54) * 100   # % of pixels that clearly changed
            if changed < threshold:
                continue
        kept.append((f, t))
        last = small
    return kept


# --------------------------------------------------------------------------- pdf

def write_pdf(images, pdf_path: Path):
    tmp_pdf = pdf_path.with_name(pdf_path.name + ".part")
    try:
        import img2pdf
        with open(tmp_pdf, "wb") as fh:
            fh.write(img2pdf.convert([str(p) for p in images]))
    except ImportError:
        from PIL import Image
        pages = [Image.open(p).convert("RGB") for p in images]
        pages[0].save(tmp_pdf, "PDF", save_all=True, append_images=pages[1:], resolution=150)
        for pg in pages:
            pg.close()
    os.replace(tmp_pdf, pdf_path)   # only a finished PDF gets the real name


# --------------------------------------------------------------------------- main

def convert_one(video, pdf_path, args):
    duration = video_duration(video)
    with tempfile.TemporaryDirectory(prefix="v2pdf_") as tmp:
        frames_dir = Path(tmp)
        if duration:
            print(f"    length {fmt_time(duration)}, one frame every {args.interval:g}s")
            frames = extract_frames_seek(video, duration, args.interval, frames_dir,
                                         args.quality, args.workers)
        else:
            print("    couldn't read length, decoding the whole video instead (slower)")
            frames = extract_frames_filter(video, args.interval, frames_dir, args.quality)

        if not frames:
            raise RuntimeError("no frames could be extracted")

        if args.skip_duplicates:
            before = len(frames)
            frames = drop_duplicates(frames, args.dup_threshold)
            print(f"    removed {before - len(frames)} duplicate page(s)")

        if args.keep_frames:
            keep_dir = pdf_path.parent / f"{video.stem}_frames"
            keep_dir.mkdir(parents=True, exist_ok=True)
            for f, t in frames:
                shutil.copy2(f, keep_dir / f"{f.stem}_{fmt_time(t).replace(':', '-')}.jpg")

        write_pdf([f for f, _ in frames], pdf_path)
        return len(frames)


def main():
    ap = argparse.ArgumentParser(
        description="Convert every video in a folder into a PDF of frames taken every N seconds.")
    ap.add_argument("inputs", nargs="*", default=[str(SCRIPT_DIR / "downloads")],
                    help="Video files and/or folders (default: downloads/ next to this script)")
    ap.add_argument("-o", "--output-dir", default=str(SCRIPT_DIR / "pdfs"),
                    help="Where the PDFs go (default: pdfs/ next to this script)")
    ap.add_argument("-i", "--interval", type=float, default=30,
                    help="Seconds between frames (default: 30)")
    ap.add_argument("-q", "--quality", type=int, default=3,
                    help="JPEG quality, 2 = best/biggest ... 10 = smaller files (default: 3)")
    ap.add_argument("-w", "--workers", type=int, default=min(4, os.cpu_count() or 2),
                    help="Frames extracted in parallel (default: up to 4)")
    ap.add_argument("--overwrite", action="store_true",
                    help="Rebuild PDFs that already exist (default: skip them)")
    ap.add_argument("--skip-duplicates", action="store_true",
                    help="Leave out a page if it looks the same as the previous page")
    ap.add_argument("--dup-threshold", type=float, default=1.5,
                    help="With --skip-duplicates: %% of the picture that must change to count as a new page (default: 1.5)")
    ap.add_argument("--keep-frames", action="store_true",
                    help="Also keep the JPEG frames in pdfs/<video name>_frames/")
    args = ap.parse_args()

    if args.interval <= 0:
        sys.exit("Error: --interval must be greater than 0")
    args.quality = max(2, min(31, args.quality))
    args.workers = max(1, args.workers)

    check_tools()
    videos = collect_videos(args.inputs)
    if not videos:
        sys.exit("No videos found in: " + ", ".join(args.inputs))

    out_dir = Path(args.output_dir).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Found {len(videos)} video(s). PDFs go to: {out_dir.resolve()}\n")
    made, skipped, failed = [], [], []
    start_all = time.time()

    for n, video in enumerate(videos, 1):
        pdf_path = out_dir / f"{video.stem}.pdf"
        print(f"[{n}/{len(videos)}] {video.name}")
        if pdf_path.exists() and not args.overwrite:
            print("    PDF already exists, skipping (use --overwrite to rebuild)\n")
            skipped.append(video.name)
            continue
        t0 = time.time()
        try:
            pages = convert_one(video, pdf_path, args)
            size_mb = pdf_path.stat().st_size / 1_048_576
            print(f"    -> {pdf_path.name}  ({pages} pages, {size_mb:.1f} MB, {fmt_time(time.time() - t0)})\n")
            made.append(video.name)
        except KeyboardInterrupt:
            print("\nStopped by user.")
            sys.exit(1)
        except Exception as e:  # keep going with the next video
            print(f"    FAILED: {e}\n")
            failed.append(video.name)

    print("=" * 60)
    print(f"Done in {fmt_time(time.time() - start_all)}: "
          f"{len(made)} converted, {len(skipped)} skipped, {len(failed)} failed")
    for name in failed:
        print(f"  failed: {name}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
```
Next, you need the youtube cookies. You could do this without cookies but some day youtube will start asking for cookies. So, I think getting cookies and updating it periodically whenever necessary is ideal.

Get them from any "Get Cookies extension" by visiting youtube website. and save them in www.youtube.com_cookies.txt file in the same directory.



