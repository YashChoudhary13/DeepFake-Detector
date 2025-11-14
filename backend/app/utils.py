# app/utils.py
import os
from PIL import Image, ImageDraw, ImageFont
from typing import Optional

HEATMAP_DIR = os.path.join("data", "heatmaps")
os.makedirs(HEATMAP_DIR, exist_ok=True)

def _safe_basename(path: str) -> str:
    """
    Return a safe base filename (no directories), sanitized for use on Windows.
    """
    base = os.path.basename(path or "")
    # remove path separators and problematic characters
    base = base.replace(":", "").replace("\\", "").replace("/", "")
    name, ext = os.path.splitext(base)
    # keep only safe chars: alphanum, hyphen, underscore, dot
    safe_name = "".join(c for c in name if c.isalnum() or c in ("-", "_"))
    return safe_name or "upload"

def generate_fake_heatmap(image_path: str, model_name: str, job_id: Optional[int] = None) -> str:
    """
    Create a tiny placeholder heatmap PNG for development.
    Returns the relative path to the saved heatmap (e.g., "data/heatmaps/<file>.png").
    """
    # ensure directory exists
    os.makedirs(HEATMAP_DIR, exist_ok=True)

    base = _safe_basename(image_path)
    if job_id:
        filename = f"{job_id}_{base}_{model_name}.png"
    else:
        filename = f"{base}_{model_name}.png"

    filename = filename.replace(" ", "_")
    out_path = os.path.join(HEATMAP_DIR, filename)

    # Create a tiny placeholder PNG (colored box + label)
    try:
        img = Image.new("RGBA", (256, 256), (255, 0, 0, 120))
        draw = ImageDraw.Draw(img)
        # optional: draw simple text (may fail if no font installed; ignore)
        try:
            font = ImageFont.load_default()
            draw.text((8, 8), f"{model_name}", fill=(255,255,255,255), font=font)
        except Exception:
            draw.text((8, 8), f"{model_name}", fill=(255,255,255,255))
        img.save(out_path)
    except Exception as exc:
        # fallback: ensure file exists (avoid crash)
        with open(out_path, "wb") as fh:
            fh.write(b"")

    return out_path  # return relative path to file (store this in DB)
