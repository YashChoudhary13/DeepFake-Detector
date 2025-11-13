import Link from "next/link";

interface DashboardItemProps {
  item: {
    job_id: string;
    thumbnail_url?: string;
    created_at: string;
    consensus?: {
      decision: string;
      score: number;
    };
  };
}

export default function DashboardItem({ item }: DashboardItemProps) {
  const decision = item.consensus?.decision || "PENDING";
  const score = Math.round((item.consensus?.score || 0) * 100);

  const color =
    decision === "FAKE"
      ? "bg-red-600"
      : decision === "REAL"
      ? "bg-green-600"
      : decision === "UNCERTAIN"
      ? "bg-yellow-500"
      : "bg-slate-400";

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex gap-4 items-center hover:shadow-md transition">
      {/* Thumbnail */}
      <img
        src={item.thumbnail_url || "/sample-thumbnails/placeholder.png"}
        alt="Thumbnail"
        className="h-20 w-28 rounded object-cover border border-slate-300"
      />

      {/* Details */}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-800">{item.job_id}</div>
            <div className="text-sm text-slate-500">
              {new Date(item.created_at).toLocaleString()}
            </div>
          </div>

          <div className="text-right">
            <div className={`px-3 py-1 rounded text-white text-sm ${color}`}>
              {decision}
            </div>
            <div className="text-xs text-slate-500 mt-1">{score}%</div>
          </div>
        </div>

        <div className="mt-3">
          <Link href={`/result/${item.job_id}`}>
            <span className="text-indigo-600 text-sm hover:underline cursor-pointer">
              View Full Report →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
