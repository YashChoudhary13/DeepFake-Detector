# app/models_interface.py
import os
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict
from .utils import generate_fake_heatmap

# Configure model list (replace names with your real model identifiers)
MODEL_LIST = [
    ("Model A", "v1.0"),
    ("Model B", "v2.0"),
    ("Model C", "v1.1"),
    ("Model D", "v1.3"),
    ("Model E", "v2.3"),
]

def _run_single_dummy_model(name: str, version: str, image_path: str) -> Dict:
    """
    Replace this function with your real model inference.
    It must return:
      {
        "name": name,
        "version": version,
        "confidence_real": float,   # 0..1
        "confidence_fake": float,   # 0..1 (1 - confidence_real is acceptable)
        "label": "real" or "fake",
        "time_ms": int,
        "heatmap_path": "/absolute/path/to/heatmap.png" or None
      }
    """
    start = time.time()
    # Simulate processing time
    time.sleep(0.25)

    # Fake confidence (for dev only)
    import random
    conf_real = float(random.uniform(0.1, 0.95))
    conf_fake = 1.0 - conf_real
    label = "real" if conf_real >= 0.5 else "fake"

    # create fake heatmap file (utils writes to data/heatmaps)
    # use image filename base to make predictable heatmap name
    heatmap_path = generate_fake_heatmap(image_path, name.replace(" ", "_"))

    return {
        "name": name,
        "version": version,
        "confidence_real": conf_real,
        "confidence_fake": conf_fake,
        "label": label,
        "time_ms": int((time.time() - start) * 1000),
        "heatmap_path": heatmap_path,
    }

async def run_models_on_image(image_path: str) -> Dict:
    """
    Run all models in parallel (threadpool) and return:
    {
      "models": [ model_result, ... ],
      "consensus": { "verdict": "REAL"/"FAKE"/"UNCERTAIN", "confidence": 0..1 }
    }
    """
    loop = asyncio.get_running_loop()
    results = []
    with ThreadPoolExecutor(max_workers=len(MODEL_LIST)) as pool:
        tasks = []
        for name, version in MODEL_LIST:
            # run synchronous worker in threadpool
            tasks.append(loop.run_in_executor(pool, _run_single_dummy_model, name, version, image_path))
        model_outputs = await asyncio.gather(*tasks)

    # compute simple consensus
    real_votes = sum(1 for m in model_outputs if m["label"] == "real")
    fake_votes = sum(1 for m in model_outputs if m["label"] == "fake")
    avg_confidence = sum(m["confidence_real"] for m in model_outputs) / len(model_outputs)

    if real_votes > fake_votes:
        verdict = "REAL"
    elif fake_votes > real_votes:
        verdict = "FAKE"
    else:
        verdict = "UNCERTAIN"

    return {
        "models": model_outputs,
        "consensus": {"verdict": verdict, "confidence": avg_confidence},
    }
