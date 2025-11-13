/* api */export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

/**
 * Upload an image to the backend.
 * Returns: { jobId: string }
 */
export async function uploadImage(file: File): Promise<{ jobId: string }> {
  const form = new FormData();
  form.append("file", file);

  // If no backend URL is set → use mock upload
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 900));
    const id = Math.random().toString(36).slice(2, 10);
    return { jobId: id };
  }

  const resp = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: form,
  });

  if (!resp.ok) {
    throw new Error("Upload failed");
  }

  return resp.json();
}

/**
 * Fetcher used by SWR hooks
 */
export const fetcher = (url: string) => {
  // Mock mode (no backend)
  if (!API_BASE) {
    if (url === "/api/dashboard") {
      const now = new Date().toISOString();

      return Promise.resolve(
        Array.from({ length: 3 }).map((_, i) => ({
          job_id: "demo" + i,
          thumbnail_url: "/sample-thumbnails/placeholder.png",
          created_at: now,
          consensus: {
            decision: i % 2 ? "REAL" : "FAKE",
            score: 0.7 - i * 0.1,
          },
        }))
      );
    }

    if (url.startsWith("/api/jobs/")) {
      const id = url.split("/").pop();

      return Promise.resolve({
        job_id: id,
        created_at: new Date().toISOString(),
        image: {
          thumbnail_url: "/sample-thumbnails/placeholder.png",
        },
        consensus: {
          decision: "FAKE",
          score: 0.82,
          explanation: [
            "3/5 models flagged face inconsistencies",
            "Model B detected reflection mismatch around the eyes",
          ],
        },
        models: [
          {
            model_name: "model-alpha",
            score: 0.93,
            version: "2.1",
            run_time_ms: 230,
            heatmap_url: "/sample-thumbnails/heatmap1.png",
            image_url: "/sample-thumbnails/placeholder.png",
          },
          {
            model_name: "model-beta",
            score: 0.8,
            version: "1.9",
            run_time_ms: 190,
            heatmap_url: "/sample-thumbnails/heatmap2.png",
            image_url: "/sample-thumbnails/placeholder.png",
          },
          {
            model_name: "model-gamma",
            score: 0.72,
            version: "3.0",
            run_time_ms: 210,
            heatmap_url: "/sample-thumbnails/heatmap3.png",
            image_url: "/sample-thumbnails/placeholder.png",
          },
          {
            model_name: "model-delta",
            score: 0.6,
            version: "1.3",
            run_time_ms: 240,
            heatmap_url: "/sample-thumbnails/heatmap4.png",
            image_url: "/sample-thumbnails/placeholder.png",
          },
          {
            model_name: "model-epsilon",
            score: 0.45,
            version: "0.9",
            run_time_ms: 300,
            heatmap_url: "/sample-thumbnails/heatmap5.png",
            image_url: "/sample-thumbnails/placeholder.png",
          },
        ],
      });
    }
  }

  // Real backend mode
  return fetch(url).then((res) => res.json());
};
