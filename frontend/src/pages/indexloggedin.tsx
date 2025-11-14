// pages/indexloggedin.tsx
import Head from "next/head";
import dynamic from "next/dynamic";
import UploadCard from "@/components/UploadCard";
import FeatureCard from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Layers, Flame, Zap, Shield, Lock, FileDown } from "lucide-react";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

export default function LoggedInHome() {
  const features = [
    {
      icon: Layers,
      title: "5-Model AI Pipeline",
      description: "Multiple state-of-the-art detection models analyze your image simultaneously.",
    },
    {
      icon: Flame,
      title: "Heatmap Visualization",
      description: "Interactive heatmaps show exactly where models detect manipulation.",
    },
    {
      icon: Zap,
      title: "High Accuracy",
      description: "Ensemble model approach achieves industry-leading detection accuracy.",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Optimized inference pipeline returns results in seconds.",
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "All images processed and stored with strict privacy controls.",
    },
    {
      icon: FileDown,
      title: "Downloadable Reports",
      description: "Export full reconstruction and model outputs as PDF.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>DeepVerify — Upload</title>
        <meta
          name="description"
          content="Upload and analyze images with DeepVerify's multi-model detection pipeline."
        />
      </Head>

      <Navbar />

      <main className="pt-16">
        {/* Top / Hero condensed for logged-in */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Quick Verify — Upload an image to start analysis
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mt-3">
                Fast, explainable, multi-model authenticity checks. Your uploads are private and processed quickly.
              </p>
            </div>
          </div>
        </section>

        {/* Main two-column area: center UploadCard (wide) + right extras */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Center column: wide Upload area (spans 2 cols on large screens) */}
              <div className="lg:col-span-2">
                <div className="rounded-xl shadow-sm border border-gray-100 bg-white p-6">
                  <h2 className="text-2xl font-semibold mb-4">Upload & Analyze</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Drag & drop an image (PNG, JPG). Results include a consensus verdict, confidence scores, and heatmaps.
                  </p>

                  {/* UploadCard should implement the drag/drop UI + progress. Keep it wide and centered. */}
                  <div className="max-w-3xl mx-auto">
                    <UploadCard />
                  </div>

                  <div className="mt-6 flex items-center gap-3 justify-center">
                    <Button size="lg" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                      Upload Image
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => window.location.href = "/dashboard"}>
                      View History
                    </Button>
                  </div>
                </div>

                {/* Feature grid (smaller) */}
                <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {features.map((f, i) => (
                    <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.description} />
                  ))}
                </div>
              </div>

              {/* Right column: extras / quick actions / recent analyses */}
              <aside className="lg:col-span-1">
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sticky top-24">
                  <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => document.querySelector<HTMLInputElement>("input[type=file]")?.click()}
                      className="w-full text-left px-4 py-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition"
                      aria-label="Upload image"
                    >
                      Upload Image
                    </button>

                    <button
                      onClick={() => (window.location.href = "/dashboard")}
                      className="w-full text-left px-4 py-3 border rounded-lg hover:shadow-sm transition"
                      aria-label="View dashboard"
                    >
                      View Dashboard
                    </button>

                    <button
                      onClick={() => (window.location.href = "/result")}
                      className="w-full text-left px-4 py-3 border rounded-lg hover:shadow-sm transition"
                      aria-label="Sample report"
                    >
                      Open Sample Report
                    </button>
                  </div>

                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-medium uppercase tracking-wide mb-3">Recent Analyses</h4>

                    {/* Placeholder list — replace with real data */}
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden flex-shrink-0" aria-hidden>
                          {/* thumbnail placeholder */}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">sample_image_01.png</div>
                          <div className="text-xs text-muted-foreground">REAL • 98% • 2m ago</div>
                        </div>
                      </li>

                      <li className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden flex-shrink-0" aria-hidden />
                        <div className="flex-1">
                          <div className="text-sm font-medium">video_frame_23.jpg</div>
                          <div className="text-xs text-muted-foreground">UNCERTAIN • 63% • 1d ago</div>
                        </div>
                      </li>

                      <li className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden flex-shrink-0" aria-hidden />
                        <div className="flex-1">
                          <div className="text-sm font-medium">portrait_test.png</div>
                          <div className="text-xs text-muted-foreground">FAKE • 88% • 3d ago</div>
                        </div>
                      </li>
                    </ul>

                    <div className="mt-4">
                      <a href="/dashboard" className="text-sm text-primary hover:underline">
                        View all analyses →
                      </a>
                    </div>
                  </div>
                </div>

                {/* Small trust panel */}
                <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Secure & Private</div>
                      <div className="text-xs text-muted-foreground">Analysis encrypted in transit</div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* small footer CTA */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="rounded-xl border bg-white p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Need help interpreting a result?</h3>
              <p className="text-sm text-muted-foreground mb-4">Contact our research team for deeper analysis and consulting.</p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => (window.location.href = "/support")}>Contact Support</Button>
                <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>View History</Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
