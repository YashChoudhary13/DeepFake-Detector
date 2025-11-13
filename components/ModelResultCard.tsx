/* model breakdown */import { useState } from "react";

interface ModelProps {
  model: {
    model_name: string;
    version?: string;
    score?: number;
    heatmap_url?: string;
    image_url?: string;
    run_time_ms?: number;
    labels?: any;
  };
}

export default function ModelResultCard({ model }: ModelProps) {
  const [opacity, setOpacity] = useState(60);
  const scorePct = Math.round((model.score || 0) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      {/* header flex */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-800 text-lg">
            {model.model_name}
            <span className="text-sm text-slate-500 ml-1">
              v{model.version || "1.0"}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Runtime: {model.run_time_ms ?? "--"} ms
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold text-slate-800">{scorePct}%</div>
          <div className="text-sm text-slate-500">confidence</div>
        </div>
      </div>

      {/* Preview area */}
      <div className="mt-4">
        <div className="relative bg-slate-100 rounded overflow-hidden border border-slate-300 h-56">
          {/* Base image */}
          <img
            src={model.image_url || "/sample-thumbnails/placeholder.png"}
            alt="Base"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Heatmap overlay */}
          {model.heatmap_url && (
            <img
              src={model.heatmap_url}
              alt="Heatmap"
              style={{ opacity: opacity / 100 }}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
            />
          )}
        </div>

        {/* Heatmap slider */}
        {model.heatmap_url && (
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-40"
            />
            <span className="text-sm text-slate-600">
              Heatmap opacity: {opacity}%
            </span>
          </div>
        )}
      </div>

      {/* Labels / Model Notes (if any) */}
      {model.labels && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded">
          <div className="text-sm text-slate-700 font-medium mb-1">
            Model Notes:
          </div>
          <pre className="text-xs text-slate-600 whitespace-pre-wrap">
            {JSON.stringify(model.labels, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
