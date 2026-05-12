import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock as LockIcon, ArrowRight } from "lucide-react";
import { Logo } from "@/components/octek/Logo";
import { ThemeToggle } from "@/components/octek/ThemeToggle";

const ALLOWED_EMAIL = "mianazeem5605@gmail.com";
const ALLOWED_PASSWORD = "123123123";
export const LS_AUTH = "octek-auth";
export const LS_AUTH_EMAIL = "octek-auth-email";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — OCTEK AI Builder" },
      { name: "description", content: "Sign in to OCTEK AI Builder to start creating apps." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      if (email.trim().toLowerCase() === ALLOWED_EMAIL && password === ALLOWED_PASSWORD) {
        try {
          localStorage.setItem(LS_AUTH, "true");
          localStorage.setItem(LS_AUTH_EMAIL, email.trim().toLowerCase());
        } catch {}
        navigate({ to: "/" });
      } else {
        setError("Invalid email or password");
      }
      setLoading(false);
    }, 350);
  }

  return (
    <div className="min-h-screen w-screen bg-[var(--bg-primary)] flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)]">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={28} />
          <div>
            <div className="font-bold leading-tight">OCTEK AI</div>
            <div className="text-[10px] font-mono tracking-[0.18em] text-[var(--text-muted)] -mt-0.5">
              BUILDER
            </div>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 grid place-items-center px-6 py-10">
        <form
          onSubmit={submit}
          className="w-full max-w-[420px] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-7 shadow-xl"
        >
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">
            Sign in to continue building.
          </p>

          <div className="mt-6">
            <label className="text-[11px] tracking-[0.12em] uppercase text-[var(--text-muted)] font-semibold">
              Email
            </label>
            <div className="relative mt-1.5">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 pl-9 pr-3 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-[11px] tracking-[0.12em] uppercase text-[var(--text-muted)] font-semibold">
              Password
            </label>
            <div className="relative mt-1.5">
              <LockIcon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-9 pr-10 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-[12px] text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full h-11 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-50 text-[#06140f] font-bold text-sm flex items-center justify-center gap-2 glow-accent"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Sign in
          </button>

          <div className="mt-5 text-center text-[11px] text-[var(--text-muted)]">
            Don't have an account? Sign up coming soon.
          </div>
        </form>
      </main>
    </div>
  );
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LS_AUTH) === "true";
  } catch {
    return false;
  }
}

export function logout() {
  try {
    localStorage.removeItem(LS_AUTH);
    localStorage.removeItem(LS_AUTH_EMAIL);
  } catch {}
}
