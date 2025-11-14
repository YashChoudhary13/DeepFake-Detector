import Head from "next/head";
import UploadCard from "@/components/UploadCard";
import FeatureCard from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Flame,
  Zap,
  Shield,
  Lock,
  FileDown,
} from "lucide-react";
import dynamic from "next/dynamic";
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
export default function Home() {
  const features = [
    {
      icon: Layers,
      title: "5-Model AI Pipeline",
      description:
        "Multiple state-of-the-art detection models analyze your image simultaneously.",
    },
    {
      icon: Flame,
      title: "Heatmap Visualization",
      description:
        "Interactive heatmaps show exactly where models detect manipulation.",
    },
    {
      icon: Zap,
      title: "High Accuracy",
      description:
        "Ensemble model approach achieves industry-leading detection accuracy.",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description:
        "Optimized inference pipeline returns results in seconds.",
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description:
        "All images processed locally and protected with strict privacy standards.",
    },
    {
      icon: FileDown,
      title: "Downloadable Reports",
      description:
        "Export full reconstruction and report data in PDF format.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>DeepVerify — Deepfake Detection</title>
        <meta
          name="description"
          content="Multi-model deepfake detection with explainable metrics and heatmap visualizations."
        />
      </Head>

      <Navbar />

      <main className="pt-16">
        {/* HERO */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Multi-Model Deepfake Detection
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Professional authenticity analysis using 5 advanced AI models.
                  Get detailed reports with heatmap visualizations and confidence scores.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <a href="/api/login">
                  <Button size="lg">Get Started</Button>
                </a>

                <a href="#features">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Trusted by researchers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>99.2% accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Secure & private</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* UPLOAD */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Try It Now</h2>
              <p className="text-muted-foreground">
                Upload an image to see how our detection pipeline works.
              </p>
            </div>

            <UploadCard />

            <p className="text-center text-sm text-muted-foreground mt-4">
              Sign in to save your analysis history and unlock more features.
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 space-y-2">
                <h2 className="text-3xl font-bold">Powerful Features</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Everything you need for professional deepfake detection.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((f, i) => (
                  <FeatureCard
                    key={i}
                    icon={f.icon}
                    title={f.title}
                    desc={f.description}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to verify authenticity?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of researchers, journalists, and security professionals using DeepVerify.
              </p>

              <a href="/login" className="mt-6 block">
                <Button size="lg">Sign In to Get Started</Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 DeepVerify. Professional deepfake detection platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
