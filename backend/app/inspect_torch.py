# save as inspect_torch.py and run: python inspect_torch.py
import torch, os, pprint
p = os.path.abspath("backend/models/best_model-v3.pt")
print("exists:", os.path.exists(p))
try:
    obj = torch.load(p, map_location="cpu")
    print("torch.load type:", type(obj))
    if isinstance(obj, dict):
        print("keys:", list(obj.keys())[:50])
    else:
        print(obj)
except Exception as e:
    print("torch.load error:", e)
    try:
        m = torch.jit.load(p, map_location="cpu")
        print("jit loaded, module:", type(m))
    except Exception as e2:
        print("jit.load error:", e2)
