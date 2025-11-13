/* result page code */import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "../../components/Navbar";
import useSWR from "swr";
import { fetcher } from "../../src/lib/api";
import ConsensusCard from "../../components/ConsensusCard";
import ModelResultCard from "../../components/ModelResultCard";

export default function ResultPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, error } = useSWR(
    () => (id ? `/api/jobs/${id}` : null),
    fetcher,
    {
      refreshInterval: 2000, // keep auto-refreshing until job is done
    }
  );

  // Show loading skeleton
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-200 rounded w-1/3"></div>
            <div className="h-64 bg-white rounded shadow"></div>
            <div className="h-64 bg-white rounded shadow"></div>
          </div>
        </main>
      </div>
    );
  }

  const job = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>Result — {job.job_id}</title>
      </Head>

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          Analysis Report
        </h1>

        {/* Grid layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left side: Consensus + Models */}
          <div className="lg:col-span-2">
            <ConsensusCard
              consensus={job.consensus}
              imageUrl={job.image?.thumbnail_url}
            />

            {/* Per-model breakdown */}
            <section className="mt-10">
              <h3 className="text-2xl font-semibold text-slate-800 mb-5">
                Per-Model Breakdown
              </h3>

              <div className="grid gap-6">
                {job.models.map((m: any) => (
                  <ModelResultCard key={m.model_name} model={m} />
                ))}
              </div>
            </section>
          </div>

          {/* Right side panel */}
          <aside className="bg-white border border-slate-200 rounded-xl shadow p-5 h-fit">
            <h4 className="font-semibold text-slate-800 mb-1">Details</h4>
            <p className="text-sm text-slate-500">
              Uploaded: {new Date(job.created_at).toLocaleString()}
            </p>

            {/* Download Report */}
            <div className="mt-5">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-full">
                Download Report (PDF)
              </button>
            </div>

            {/* Re-run / debug */}
            <div className="mt-4">
              <button
                className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300 w-full text-slate-700"
                onClick={() => {
                  alert("Requeue backend endpoint not connected yet.");
                }}
              >
                Re-run Analysis
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
