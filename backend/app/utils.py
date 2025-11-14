from PIL import Image, ImageDraw
import os
import random

HEATMAP_DIR = "data/heatmaps"
os.makedirs(HEATMAP_DIR, exist_ok=True)


def generate_fake_heatmap(job_id: int, model_name: str):
    img = Image.new("RGB", (400, 300), (0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw random heatmap dots
    for _ in range(150):
        x = random.randint(0, 400)
        y = random.randint(0, 300)
        color = (255, random.randint(0, 255), 0)
        draw.ellipse([x - 6, y - 6, x + 6, y + 6], fill=color)

    filename = f"{HEATMAP_DIR}/{job_id}_{model_name}.png"
    img.save(filename)

    return filename
