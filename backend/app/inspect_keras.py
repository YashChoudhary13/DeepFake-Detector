# save as inspect_keras.py and run: python inspect_keras.py
import os
import tensorflow as tf
files = [
 "backend/models/ai_detector_cnn.h5",
 "backend/models/deepfake_detection_xception_180k_14epochs.h5",
 "backend/models/DenseNet121Model.keras",
 "backend/models/model2.keras",
]
for f in files:
    p = os.path.abspath(f)
    print("=== ", f, os.path.exists(p))
    try:
        m = tf.keras.models.load_model(p, compile=False)
        # print input shapes
        try:
            print("model.inputs:", m.inputs)
            print("input_shape:", getattr(m, "input_shape", None))
            print("summary:")
            m.summary()
        except Exception as e:
            print("Could not print summary:", e)
    except Exception as e:
        print("load_model failed:", e)
