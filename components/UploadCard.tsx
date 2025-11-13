/* upload */import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { uploadImage } from "../src/lib/api";

export default function UploadCard() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = (f: File) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(f.type)) return "Only JPEG and PNG allowed";
    if (f.size > 10_000_000) return "Max file size is 10MB";
    return null;
  };

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validate(f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (ev: React.DragEvent<HTMLDivElement>) => {
      ev.preventDefault();
      const f = ev.dataTransfer.files?.[0];
      if (!f) return;
      const err = validate(f);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setFile(f);
    },
    []
  );

  const onDragOver = useCallback((ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
  }, []);

  const onUpload = async () => {
    if (!file) {
      setError("Select a file first");
      return;
    }
    setLoading(true);
    try {
      const res = await uploadImage(file);
      // For local demo, mark user signed-in so navbar shows Dashboard links
      try {
        localStorage.setItem("demo_user", "1");
      } catch {}
      router.push(`/result/${res.jobId}`);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded shadow p-6">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="border-2 border-dashed border-slate-200 rounded p-6 text-center cursor-pointer"
      >
        <p className="text-slate-700 mb-4">Drop an image here or</p>

        <label className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer">
          <input
            onChange={onFileChange}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload an image"
          />
          Choose file
        </label>

        <div className="mt-3">
          {file && (
            <div className="flex items-center justify-center gap-4">
              <div className="text-sm text-slate-700">{file.name}</div>
              <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              <button
                onClick={() => setFile(null)}
                className="text-sm text-red-600 underline ml-2"
                aria-label="Remove file"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={onUpload}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Analyzing…" : "Upload & Analyze"}
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          Supported: JPG, PNG — max 10MB. By uploading you agree to our terms.
        </div>
      </div>
    </div>
  );
}
