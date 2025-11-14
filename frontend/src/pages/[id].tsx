import Head from "next/head";
import dynamic from "next/dynamic";
import ConsensusCard from "../../src/components/ConsensusCard";
import ModelResultCard from "../../src/components/ModelResultCard";
import useSWR from "swr";
import { fetcher } from "../../src/lib/api";
import { useRouter } from "next/router";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Loader2 } from "lucide-react";
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

export default function ResultPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: job, error } = useSWR(
    () => (id ? `/api/jobs/${id}` : null),
    fetcher,
    { refreshInterval: 2000 }
  );

  const isLoading = !job && !error;
  const isProcessing =
    job?.status === "pending" || job?.status === "processing";

  // ---------- LOADING UI ----------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-16 max-w-6xl mx-auto px-4 py-12">
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Job not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Analysis Result — {job.job_id}</title>
      </Head>

      <Navbar />

      <main className="pt-16 max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analysis Results</h1>
          <p className="text-muted-foreground">{job.job_id}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN — CONSENSUS + MODELS */}
          <div className="lg:col-span-2 space-y-10">
            {/* Consensus Card */}
            <ConsensusCard
              consensus={job.consensus}
              imageUrl={job.image?.thumbnail_url}
            />

            {/* Per-model breakdown */}
            <section>
              <h3 className="text-2xl font-semibold mb-5">
                Per-Model Breakdown
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {job.models?.map((model: any, index: number) => (
                  <ModelResultCard key={index} model={model} />
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-6 sticky top-24 h-fit">
            {/* Image */}
            <Card className="p-3">
              <img
                src={job.image?.thumbnail_url}
                alt="Analyzed Image"
                className="rounded-md w-full"
              />
            </Card>

            {/* Buttons */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-run Analysis
              </Button>

              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            {/* Details */}
            <Card className="p-5">
              <h4 className="font-semibold mb-1">Details</h4>
              <p className="text-sm text-muted-foreground">
                Uploaded: {new Date(job.created_at).toLocaleString()}
              </p>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
