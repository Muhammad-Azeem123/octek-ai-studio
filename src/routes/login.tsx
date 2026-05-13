import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { Logo } from "@/components/octek/Logo";
import { ThemeToggle } from "@/components/octek/ThemeToggle";
import { isAuthenticated, login } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — OCTEK AI Builder" },
      { name: "description", content: "Sign in to your OCTEK AI Builder account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) navigate({ to: "/dashboard" });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 450));
    const session = login(email, password);
    setSubmitting(false);
    if (!session) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden flex flex-col">
      {/* Animated background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[var(--accent)]/15 blur-[140px] animate-pulse" />
        <div
          className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-[var(--accent)]/10 blur-[140px] animate-pulse"
          style={{ animationDelay: "1.2s" }}
        />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(var(--text-primary)_1px,transparent_1px),linear-gradient(90deg,var(--text-primary)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <Logo size={26} />
          <div>
            <div className="font-bold leading-tight text-sm">OCTEK AI</div>
            <div className="text-[9px] font-mono tracking-[0.18em] text-[var(--text-muted)] -mt-0.5">
              BUILDER
            </div>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] animate-fade-up">
          <div className="bg-[var(--bg-card)]/80 backdrop-blur-xl border border-[var(--border)] rounded-2xl p-7 shadow-2xl glow-accent">
            <div className="text-center mb-7">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] grid place-items-center mx-auto mb-4 glow-accent">
                <Lock size={20} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5">
                Sign in to continue building with OCTEK AI
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 text-[12.5px] bg-[var(--danger)]/10 border border-[var(--danger)]/40 text-[var(--danger)] rounded-md px-3 py-2 animate-fade-up">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <Field
                icon={<Mail size={14} />}
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoFocus
              />
              <div>
                <label className="block text-[11px] font-semibold tracking-wider text-[var(--text-muted)] mb-1.5 uppercase">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    <Lock size={14} />
                  </span>
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none rounded-md text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] pl-9 pr-10 py-2.5 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    aria-label="Toggle password visibility"
                  >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-60 text-[#06140f] font-bold py-2.5 rounded-md glow-accent-strong transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-[12.5px] text-[var(--text-secondary)]">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-[var(--accent)] font-semibold hover:underline"
              >
                Sign up
              </Link>
            </div>

            <div className="mt-3 text-center text-[11px] text-[var(--text-muted)]">
              By continuing, you agree to our Terms & Privacy Policy.
            </div>
          </div>

          <div className="mt-5 text-center text-[12px] text-[var(--text-secondary)]">
            <Link to="/" className="hover:text-[var(--accent)] transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold tracking-wider text-[var(--text-muted)] mb-1.5 uppercase">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none rounded-md text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] pl-9 pr-3 py-2.5 transition-colors"
        />
      </div>
    </div>
  );
}
