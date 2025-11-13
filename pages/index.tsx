/* full landing page code here */
import Head from "next/head";
import Navbar from "../components/Navbar";
import UploadCard from "../components/UploadCard";
import FeatureCard from "../components/FeatureCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>DeepVerify — Deepfake Detection</title>
        <meta
          name="description"
          content="Multi-model deepfake detection with explainable metrics and heatmap visualizations."
        />
      </Head>

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* HERO SECTION */}
        <section className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-4">
            DeepVerify
          </h1>
          <p className="text-slate-600 mb-10 text-lg">
            Multi-Model Deepfake Detection — Fast. Accurate. Transparent.
          </p>

          <div className="mx-auto max-w-2xl">
            <UploadCard />
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6 text-center">
            Why DeepVerify?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="5-Model AI Detection Pipeline"
              desc="We run your image across 5 advanced detectors and aggregate their outputs for maximum confidence."
            />
            <FeatureCard
              title="Explainable Metrics & Heatmaps"
              desc="Visual heatmaps reveal where artifacts or inconsistencies were detected in the image."
            />
            <FeatureCard
              title="User Dashboard with History"
              desc="Your account stores your last 10 analyses and allows full result review at any time."
            />
            <FeatureCard
              title="Fast & Efficient Processing"
              desc="Results ready in seconds thanks to optimized pipelines and async workers."
            />
            <FeatureCard
              title="Secure & Trusted Platform"
              desc="Private, isolated processing environment — your data never leaves our secure system."
            />
            <FeatureCard
              title="Exportable Reports"
              desc="Download detailed PDF/JSON reports for verification, academic use, or evidence."
            />
          </div>
        </section>
      </main>
    </div>
  );
}
