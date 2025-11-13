interface ConsensusProps {
  consensus?: {
    decision: string;
    score: number;
    explanation?: string[];
  };
  imageUrl?: string;
}

export default function ConsensusCard({ consensus, imageUrl }: ConsensusProps) {
  const decision = consensus?.decision || "PENDING";
  const score = Math.round((consensus?.score || 0) * 100);

  const color =
    decision === "FAKE"
      ? "text-red-600"
      : decision === "REAL"
      ? "text-green-600"
      : decision === "UNCERTAIN"
      ? "text-yellow-600"
      : "text-slate-500";

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex gap-6 items-start">
        {/* Image preview */}
        <img
          src={imageUrl || "/sample-thumbnails/placeholder.png"}
          className="h-32 w-32 object-cover rounded border border-slate-300"
          alt="Analyzed Image"
        />

        {/* Consensus section */}
        <div className="flex-1">
          <h2 className={`text-3xl font-bold ${color}`}>{decision}</h2>
          <p className="text-slate-700 mt-1">
            Confidence score: <strong>{score}%</strong>
          </p>

          {consensus?.explanation && (
            <div className="mt-3">
              {consensus.explanation.map((line, idx) => (
                <div key={idx} className="text-sm text-slate-600">
                  • {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/* consensus */