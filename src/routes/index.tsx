import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Monitor, Sparkles, Key } from "lucide-react";
import { Logo } from "@/components/octek/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OCTEK AI Builder — Build AI-powered web apps in seconds" },
      {
        name: "description",
        content:
          "Describe it. We build it. Live preview instantly. Switch between Gemini, GPT, Claude. Bring your own API key.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="h-screen w-screen overflow-y-auto scrollbar-thin bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <div>
            <div className="font-bold leading-tight">OCTEK AI</div>
            <div className="text-[10px] font-mono tracking-[0.18em] text-[var(--text-muted)] -mt-0.5">
              BUILDER
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Sign in
          </Link>
          <Link
            to="/dashboard"
            className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-[#06140f] font-bold text-sm px-4 py-2 rounded-md glow-accent transition-colors"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--accent)] mb-6">
          <Sparkles size={11} />
          AI-powered web app generator
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Build AI-Powered Web Apps
          <br />
          <span className="text-[var(--accent)]">in Seconds</span>
        </h1>
        <p className="text-[var(--text-secondary)] mt-5 text-lg">
          Describe it. We build it. Live preview instantly.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            to="/dashboard"
            className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-[#06140f] font-bold px-5 py-3 rounded-md flex items-center gap-2 glow-accent-strong"
          >
            Start Building Free <ArrowRight size={16} />
          </Link>
          <Link
            to="/dashboard"
            className="bg-[var(--bg-card)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)] px-5 py-3 rounded-md font-semibold"
          >
            See Demo
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-20 text-left">
          <Feature icon={<Monitor size={18} />} title="Live Preview">
            See your app rendered in real time as the agent builds it. Iterate in seconds, not hours.
          </Feature>
          <Feature icon={<Sparkles size={18} />} title="Multi-Model Support">
            Switch between Gemini, GPT-5, Claude Opus, and more. Use the model best for the job.
          </Feature>
          <Feature icon={<Key size={18} />} title="Your API Key — Your Control">
            Bring your own provider key. We encrypt it and never expose it to the browser.
          </Feature>
        </div>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] grid place-items-center mb-3">
        {icon}
      </div>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{children}</div>
    </div>
  );
}
