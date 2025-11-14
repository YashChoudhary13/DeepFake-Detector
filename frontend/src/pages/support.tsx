// pages/support.tsx
import Head from "next/head";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const API = process.env.NEXT_PUBLIC_API_URL || "";
export default function Support() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<null | "idle" | "sending" | "success" | "error">(null);

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      setStatus("error");
      return;
    }
    setStatus("sending");

    try {
      // Replace this URL with your backend support endpoint if you have one
      const res = await fetch(`${API}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>DeepVerify — Support</title>
        <meta name="description" content="Contact support for DeepVerify — help with billing, technical issues and research inquiries." />
      </Head>

      <Navbar />

      <main className="pt-16">
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-3xl md:text-4xl font-bold">Support & Help Center</h1>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto mt-3">
              We’re here to help. Submit a ticket below or browse documentation and FAQs.
            </p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4 max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Contact Support</h2>

              <form onSubmit={submitTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Your name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="you@domain.com"
                    required
                    type="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border rounded px-3 py-2 h-32"
                    placeholder="Describe the issue or request"
                    required
                  />
                </div>

                <div>
                  <Button type="submit" size="lg" disabled={status === "sending"}>
                    {status === "sending" ? "Sending..." : "Send Message"}
                  </Button>

                  {status === "success" && (
                    <div className="text-green-600 text-sm mt-3">Thank you — we will reply soon.</div>
                  )}
                  {status === "error" && (
                    <div className="text-red-600 text-sm mt-3">Error sending message. Please try again.</div>
                  )}
                </div>
              </form>
            </div>

            <aside className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Quick resources</h3>

              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="/docs" className="text-primary hover:underline">Documentation</a>
                </li>
                <li>
                  <a href="/faq" className="text-primary hover:underline">FAQ</a>
                </li>
                <li>
                  <a href="/membership" className="text-primary hover:underline">Billing & Plans</a>
                </li>
              </ul>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Office hours</h4>
                <div className="text-sm text-muted-foreground">Mon–Fri, 09:00–18:00 UTC</div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
