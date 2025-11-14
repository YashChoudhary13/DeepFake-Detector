// pages/membership.tsx
import Head from "next/head";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Shield, Zap, FileDown } from "lucide-react";
import { useCallback, useState } from "react";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function Membership() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const startCheckout = useCallback(async (plan: "pro_monthly" | "pro_yearly") => {
    try {
      setLoadingPlan(plan);
      const res = await fetch(`${API}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to create checkout session");
      }

      const data = await res.json();
      // redirect the browser to Stripe Checkout (session URL)
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Could not start checkout. See console for details.");
    } finally {
      setLoadingPlan(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>DeepVerify — Membership</title>
        <meta
          name="description"
          content="Choose a DeepVerify plan for advanced features, priority processing and team access."
        />
      </Head>

      <Navbar />

      <main className="pt-16">
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-3xl md:text-4xl font-bold">Membership plans for professionals</h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto mt-3">
              Unlock priority processing, batch uploads, and downloadable reports. Select a plan that
              fits your team's needs.
            </p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Left: Benefits */}
              <div className="md:col-span-1 rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-3">Why upgrade?</h2>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li className="flex gap-3 items-start">
                    <Shield className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <div className="font-medium">Priority processing</div>
                      <div className="text-xs">Shorter queue times for time-sensitive analysis.</div>
                    </div>
                  </li>

                  <li className="flex gap-3 items-start">
                    <Zap className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <div className="font-medium">Batch uploads</div>
                      <div className="text-xs">Process multiple images simultaneously.</div>
                    </div>
                  </li>

                  <li className="flex gap-3 items-start">
                    <FileDown className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <div className="font-medium">Downloadable reports</div>
                      <div className="text-xs">Export PDFs with model outputs and heatmaps.</div>
                    </div>
                  </li>
                </ul>

                <div className="mt-6">
                  <a href="/support" className="text-sm text-primary hover:underline">
                    Need enterprise features? Contact sales →
                  </a>
                </div>
              </div>

              {/* Pricing cards */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly */}
                <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold">Pro — Monthly</h3>
                      <p className="text-sm text-muted-foreground mt-1">Billed monthly, cancel anytime</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold leading-none">$19</div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm">
                    <li>Priority processing</li>
                    <li>25 uploads / month</li>
                    <li>Downloadable PDF reports</li>
                    <li>Email support</li>
                  </ul>

                  <div className="mt-6">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => startCheckout("pro_monthly")}
                      disabled={loadingPlan === "pro_monthly"}
                    >
                      {loadingPlan === "pro_monthly" ? "Redirecting…" : "Start Pro"}
                    </Button>
                  </div>
                </div>

                {/* Yearly */}
                <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold">Pro — Yearly</h3>
                      <p className="text-sm text-muted-foreground mt-1">Best value — save 20%</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold leading-none">$179</div>
                      <div className="text-xs text-muted-foreground">per year</div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm">
                    <li>Priority processing</li>
                    <li>300 uploads / year</li>
                    <li>Downloadable PDF reports</li>
                    <li>Priority email support</li>
                  </ul>

                  <div className="mt-6">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => startCheckout("pro_yearly")}
                      disabled={loadingPlan === "pro_yearly"}
                    >
                      {loadingPlan === "pro_yearly" ? "Redirecting…" : "Start Yearly"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-10 rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Frequently asked questions</h3>

              <div className="space-y-3 text-sm text-muted-foreground">
                <details className="p-3 rounded-lg border">
                  <summary className="font-medium cursor-pointer">Can I cancel anytime?</summary>
                  <div className="mt-2">Yes — monthly plans can be cancelled from your account page without penalties.</div>
                </details>

                <details className="p-3 rounded-lg border">
                  <summary className="font-medium cursor-pointer">Do you offer team or enterprise plans?</summary>
                  <div className="mt-2">Yes — contact our sales team via the Support page for a tailored plan.</div>
                </details>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
