/* dashboard code */import Head from "next/head";
import Navbar from "../components/Navbar";
import useSWR from "swr";
import { fetcher } from "../src/lib/api";
import DashboardItem from "../components/DashboardItem";

export default function Dashboard() {
  const { data, error } = useSWR("/api/dashboard", fetcher, {
    fallbackData: [],
  });

  const items = data || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>Dashboard — DeepVerify</title>
        <meta name="description" content="Your recent image analyses." />
      </Head>

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">
          Your Recent Analyses
        </h1>

        {items.length === 0 ? (
          <p className="text-slate-600">
            No previous analyses found.  
            Upload an image from the homepage to get started!
          </p>
        ) : (
          <div className="grid gap-4">
            {items.slice(0, 10).map((it: any) => (
              <DashboardItem key={it.job_id} item={it} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
