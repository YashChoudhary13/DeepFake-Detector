# app/models_interface.py
"""
Unified model interface supporting PyTorch (.pt) and Keras/TensorFlow (.h5, .keras).

Register models in MODEL_REGISTRY. Each entry:
{
  "name": "FriendlyName",
  "path": "filename_or_relative_or_absolute_path",
  "framework": "torch" or "keras" (optional, inferred from extension),
  "input_size": 224,
  "version": "1.0",
  # optional: loader: callable(path, device) -> loaded_model
  # optional: preprocess: "imagenet" or "none" (defaults to imagenet normalization)
}

Produces for each model:
{
  "name","version","confidence_real","confidence_fake","label","time_ms","heatmap_path"
}
"""

import os
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional, Dict, Any, List
import traceback

import numpy as np
from PIL import Image, ImageOps
import matplotlib.pyplot as plt

# PyTorch imports (import when needed)
try:
    import torch
    import torchvision.transforms as T
    TORCH_AVAILABLE = True
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
except Exception:
    torch = None
    T = None
    TORCH_AVAILABLE = False
    DEVICE = None

# TensorFlow / Keras imports (import when needed)
try:
    import tensorflow as tf
    TF_AVAILABLE = True
    # Configure TF to avoid hogging GPU memory if present (optional)
    try:
        gpus = tf.config.list_physical_devices("GPU")
        if gpus:
            for g in gpus:
                tf.config.experimental.set_memory_growth(g, True)
    except Exception:
        pass
except Exception:
    tf = None
    TF_AVAILABLE = False

# Paths (robust)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))  # backend root
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))  # project root (one level up)
MODELS_DIR = os.path.abspath(os.path.join(BASE_DIR, "models"))  # backend/models
ALT_MODELS_DIR = os.path.abspath(os.path.join(BASE_DIR, "models", "models"))  # accidental nested copy
APP_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))  # app/models (rare)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(os.path.dirname(BASE_DIR), exist_ok=True)  # ensure parent exists

HEATMAP_DIR = os.path.abspath(os.path.join(BASE_DIR, "data", "heatmaps"))
os.makedirs(HEATMAP_DIR, exist_ok=True)

# -----------------------
# MODEL REGISTRY — Use filenames or relative path under backend/models.
# You can replace the `path` with an absolute path if you prefer.
# -----------------------
MODEL_REGISTRY: List[Dict[str, Any]] = [
    {"name": "BestModelPT", "path": "best_model-v3.pt", "framework": "torch", "input_size": 224, "version": "1.0"},
    {"name": "AI_CNN", "path": "ai_detector_cnn.h5", "framework": "keras", "input_size": 224, "version": "1.0"},
    {"name": "XceptionFake", "path": "deepfake_detection_xception_180k_14epochs.h5", "framework": "keras", "input_size": 299, "version": "1.0"},
    {"name": "DenseNet121", "path": "DenseNet121Model.keras", "framework": "keras", "input_size": 224, "version": "1.0"},
    {"name": "Model2_Keras", "path": "model2.keras", "framework": "keras", "input_size": 224, "version": "1.0"},
]

# Lightweight cache to avoid reload
_MODEL_CACHE: Dict[str, Any] = {}
_MODEL_CACHE_LOCK = threading.Lock()

# -----------------------
# Loaders
# -----------------------
def _load_torch_model(path: str):
    if not TORCH_AVAILABLE:
        raise RuntimeError("Torch not available. Install torch to load .pt models.")
    # Prefer torch.jit.load, then fallback to torch.load
    try:
        model = torch.jit.load(path, map_location=DEVICE)
        model.eval()
        return model.to(DEVICE)
    except Exception:
        obj = torch.load(path, map_location=DEVICE)
        if isinstance(obj, torch.nn.Module):
            obj.to(DEVICE)
            obj.eval()
            return obj
        # else maybe it's state_dict: user must provide custom loader
        raise RuntimeError("Loaded object is not a nn.Module. Provide a custom loader for state_dict-based files.")

def _load_keras_model(path: str):
    if not TF_AVAILABLE:
        raise RuntimeError("TensorFlow not available. Install tensorflow to load .h5/.keras models.")
    # Use tf.keras.models.load_model which supports .h5 and saved models
    try:
        model = tf.keras.models.load_model(path, compile=False)
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load Keras model at {path}: {e}")

def _load_model_entry(entry: Dict[str, Any]):
    """
    Loads model according to entry. Caches loaded models.
    Tries multiple likely locations to account for developer copy mistakes.
    Prints candidates it tried.
    """
    name = entry.get("name", "unknown")
    raw_path = entry.get("path")
    if not raw_path:
        raise RuntimeError(f"Model entry for '{name}' missing 'path'")

    # Build candidate paths to try (in order)
    candidates = []

    # Provided absolute path -> try as-is first
    if os.path.isabs(raw_path):
        candidates.append(raw_path)
    else:
        # raw relative (relative to current working dir)
        candidates.append(os.path.abspath(raw_path))
        # backend/models/<raw_path>
        candidates.append(os.path.join(MODELS_DIR, raw_path))
        # backend/models/models/<raw_path> (handles accidental nested copy)
        candidates.append(os.path.join(ALT_MODELS_DIR, raw_path))
        # app/models/<raw_path>
        candidates.append(os.path.join(APP_MODELS_DIR, raw_path))
        # project root models folder
        candidates.append(os.path.join(PROJECT_ROOT, "models", raw_path))
        # project root /models/<raw_path>
        candidates.append(os.path.join(PROJECT_ROOT, raw_path))

    # Normalize and deduplicate
    normed = []
    for p in candidates:
        try:
            p_abs = os.path.abspath(p)
        except Exception:
            continue
        if p_abs not in normed:
            normed.append(p_abs)

    # Print what we will try (helpful for debugging)
    print(f"[models_interface] Loading model '{name}' (raw='{raw_path}'). Candidate paths:")
    for p in normed:
        print(f"  - {p}")

    # pick the first existing
    path = None
    for p in normed:
        if os.path.exists(p):
            path = p
            break

    if not path:
        raise RuntimeError(
            f"Model path not found for '{name}'. Tried:\n" +
            "\n".join(f"  - {p}" for p in normed) +
            f"\nPut the file under {MODELS_DIR} (or update MODEL_REGISTRY to point to the correct path)."
        )

    loader = entry.get("loader", None)
    framework = (entry.get("framework") or os.path.splitext(path)[1].lower().lstrip(".")).lower()

    cache_key = f"{name}:{path}"
    with _MODEL_CACHE_LOCK:
        if cache_key in _MODEL_CACHE:
            return _MODEL_CACHE[cache_key]

    if loader and callable(loader):
        model = loader(path, DEVICE)
    else:
        try:
            if framework in ("pt", "pth", "torch", "torchscript"):
                model = _load_torch_model(path)
            elif framework in ("h5", "keras", "tf", "tfkeras"):
                model = _load_keras_model(path)
            else:
                # fallback: try torch then keras
                try:
                    model = _load_torch_model(path)
                except Exception:
                    model = _load_keras_model(path)
        except Exception as e:
            raise RuntimeError(f"Failed to load model '{name}' at {path}: {e}")

    with _MODEL_CACHE_LOCK:
        _MODEL_CACHE[cache_key] = model
    return model

# -----------------------
# Preprocessing helpers
# -----------------------
def _preprocess_for_torch(img_pil: Image.Image, input_size: int):
    # resize & center-crop to input_size, normalize w/ ImageNet mean/std
    img = ImageOps.fit(img_pil.convert("RGB"), (input_size, input_size), Image.LANCZOS)
    arr = np.array(img).astype(np.float32) / 255.0  # HWC
    arr = np.transpose(arr, (2,0,1))  # CHW
    tensor = torch.tensor(arr, dtype=torch.float32, device=DEVICE).unsqueeze(0)
    mean = torch.tensor([0.485,0.456,0.406], device=DEVICE).view(1,3,1,1)
    std = torch.tensor([0.229,0.224,0.225], device=DEVICE).view(1,3,1,1)
    tensor = (tensor - mean) / std
    return tensor

def _preprocess_for_keras(img_pil: Image.Image, input_size: int):
    img = ImageOps.fit(img_pil.convert("RGB"), (input_size, input_size), Image.LANCZOS)
    arr = np.array(img).astype(np.float32)
    arr = arr / 255.0
    inp = np.expand_dims(arr, axis=0)
    return inp

# -----------------------
# Forward/predict helpers
# -----------------------
def _predict_with_torch(model, input_tensor):
    model.eval()
    with torch.no_grad():
        out = model(input_tensor)
        if isinstance(out, dict):
            if "logits" in out:
                pred = out["logits"]
            else:
                tensors = [v for v in out.values() if torch.is_tensor(v)]
                pred = tensors[0] if tensors else out
        else:
            pred = out

        if isinstance(pred, np.ndarray):
            pred = torch.from_numpy(pred).to(DEVICE)

        if not torch.is_tensor(pred):
            raise RuntimeError("Torch model did not return tensor-like output")

        if pred.dim() == 2 and pred.size(0) == 1:
            probs = torch.softmax(pred, dim=1).cpu().numpy()[0]
        elif pred.dim() == 1:
            probs = torch.softmax(pred.unsqueeze(0), dim=1).cpu().numpy()[0]
        else:
            flat = pred.view(pred.size(0), -1)
            probs = torch.softmax(flat, dim=1).cpu().numpy()[0]
    return probs

def _predict_with_keras(model, input_np):
    pred = model.predict(input_np)
    pred = np.asarray(pred)
    if pred.ndim == 2 and pred.shape[0] == 1:
        probs = pred[0]
    elif pred.ndim == 1:
        probs = pred
    else:
        probs = pred.reshape(-1)
    if np.any(probs < 0) or np.any(probs > 1):
        exp = np.exp(probs - np.max(probs))
        probs = exp / exp.sum()
    return probs

# -----------------------
# Simple occlusion heatmap generation
# -----------------------
def _generate_occlusion_heatmap_generic(predict_fn, img_pil: Image.Image, input_size: int, target_class_idx: int = 1,
                                        patch_size: int = 32, stride: int = 16):
    w, h = img_pil.size
    img_resized = ImageOps.fit(img_pil.convert("RGB"), (input_size, input_size), Image.LANCZOS)
    base_pred = predict_fn(img_resized)
    base_target = float(base_pred[target_class_idx]) if target_class_idx < len(base_pred) else float(base_pred[0])
    ps = max(8, int(patch_size * input_size / 224))
    st = max(4, int(stride * input_size / 224))
    heatmap = np.zeros((input_size, input_size), dtype=np.float32)
    counts = np.zeros_like(heatmap)
    mean_color = tuple(map(int, ImageOps.fit(img_resized, (1,1)).getpixel((0,0))))
    for y in range(0, input_size - ps + 1, st):
        for x in range(0, input_size - ps + 1, st):
            occluded = img_resized.copy()
            patch = Image.new("RGB", (ps, ps), mean_color)
            occluded.paste(patch, (x, y))
            pred = predict_fn(occluded)
            target_prob = float(pred[target_class_idx]) if target_class_idx < len(pred) else float(pred[0])
            drop = base_target - target_prob
            heatmap[y:y+ps, x:x+ps] += max(0.0, drop)
            counts[y:y+ps, x:x+ps] += 1.0
    counts[counts == 0] = 1.0
    heatmap = heatmap / counts
    heatmap = np.clip(heatmap, 0.0, None)
    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()
    cmap = plt.get_cmap("jet")
    colored = cmap(heatmap)[:, :, :3]
    colored = (colored * 255).astype(np.uint8)
    heat_pil = Image.fromarray(colored).resize((w,h), Image.BILINEAR)
    return heat_pil

# -----------------------
# Runner for single model
# -----------------------
def _run_single_model(entry: Dict[str, Any], file_path: str, job_id: Optional[int] = None) -> Dict[str, Any]:
    name = entry.get("name", "unknown")
    version = entry.get("version", "1.0")
    input_size = int(entry.get("input_size", 224))
    framework = entry.get("framework", None)
    try:
        model = _load_model_entry(entry)
    except Exception as e:
        traceback.print_exc()
        return {
            "name": name,
            "version": version,
            "confidence_real": 0.5,
            "confidence_fake": 0.5,
            "label": "error",
            "time_ms": 0.0,
            "heatmap_path": "N/A",
        }

    t0 = time.time()
    img = Image.open(file_path).convert("RGB")
    try:
        ext = (framework or os.path.splitext(entry.get("path",""))[1].lower()).lstrip(".")
        if ext in ("pt","pth","torch","torchscript"):
            if not TORCH_AVAILABLE:
                raise RuntimeError("Torch not installed on server")
            inp = _preprocess_for_torch(img, input_size)
            probs = _predict_with_torch(model, inp)
        else:
            if not TF_AVAILABLE:
                raise RuntimeError("TensorFlow not installed on server")
            inp_np = _preprocess_for_keras(img, input_size)
            probs = _predict_with_keras(model, inp_np)

        probs = np.asarray(probs).astype(np.float32)
        if probs.size >= 2:
            confidence_real = float(probs[0])
            confidence_fake = float(probs[1]) if probs.size > 1 else (1.0 - confidence_real)
            label = "fake" if confidence_fake > confidence_real else "real"
            target_idx = 1 if label == "fake" else 0
        else:
            confidence_fake = float(probs[0])
            confidence_real = 1.0 - confidence_fake
            label = "fake" if confidence_fake > confidence_real else "real"
            target_idx = 1 if label == "fake" else 0

        heatmap_path = "N/A"
        try:
            def predict_fn_for_heat(pil_img):
                ext_local = (framework or os.path.splitext(entry.get("path",""))[1].lower()).lstrip(".")
                if ext_local in ("pt","pth","torch","torchscript"):
                    inp_t = _preprocess_for_torch(pil_img, input_size)
                    return _predict_with_torch(model, inp_t)
                else:
                    inp_np_local = _preprocess_for_keras(pil_img, input_size)
                    return _predict_with_keras(model, inp_np_local)

            heat_img = _generate_occlusion_heatmap_generic(predict_fn_for_heat, img, input_size, target_class_idx=target_idx)
            fname = f"heatmap_{name}_{int(time.time()*1000)}_{os.getpid()}.png"
            heatpath = os.path.join(HEATMAP_DIR, fname)
            heat_img.save(heatpath)
            heatmap_path = heatpath
        except Exception:
            heatmap_path = "N/A"

        t1 = time.time()
        time_ms = (t1 - t0) * 1000.0
        return {
            "name": name,
            "version": version,
            "confidence_real": round(float(confidence_real), 6),
            "confidence_fake": round(float(confidence_fake), 6),
            "label": label,
            "time_ms": round(time_ms, 2),
            "heatmap_path": heatmap_path,
        }
    except Exception:
        traceback.print_exc()
        return {
            "name": name,
            "version": version,
            "confidence_real": 0.5,
            "confidence_fake": 0.5,
            "label": "error",
            "time_ms": 0.0,
            "heatmap_path": "N/A",
        }

# -----------------------
# Async runner used by tasks.py
# -----------------------
async def run_models_on_image(file_path: str, job_id: Optional[int] = None) -> Dict[str, Any]:
    if not MODEL_REGISTRY:
        raise RuntimeError("MODEL_REGISTRY empty. Edit app/models_interface.py and add models.")
    results: List[Dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=min(4, len(MODEL_REGISTRY))) as ex:
        futures = [ex.submit(_run_single_model, entry, file_path, job_id) for entry in MODEL_REGISTRY]
        for fut in as_completed(futures):
            try:
                r = fut.result()
            except Exception as e:
                traceback.print_exc()
                r = {
                    "name": "unknown",
                    "version": "1.0",
                    "confidence_real": 0.5,
                    "confidence_fake": 0.5,
                    "label": "error",
                    "time_ms": 0.0,
                    "heatmap_path": "N/A",
                }
            results.append(r)

    # consensus
    try:
        labels = [r.get("label","unknown") for r in results]
        fake_count = labels.count("fake")
        real_count = labels.count("real")
        if fake_count > real_count:
            decision = "FAKE"
            avg_conf = float(sum(r.get("confidence_fake",0.5) for r in results)/max(1,len(results)))
        elif real_count > fake_count:
            decision = "REAL"
            avg_conf = float(sum(r.get("confidence_real",0.5) for r in results)/max(1,len(results)))
        else:
            decision = "UNCERTAIN"
            avg_conf = 0.5
        consensus = {"decision": decision, "score": avg_conf, "explanation": ["Analyzed by models"]}
    except Exception:
        consensus = {"decision": "PENDING", "score": 0.0, "explanation": []}

    return {"models": results, "consensus": consensus}
