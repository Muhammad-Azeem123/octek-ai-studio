import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "octek-theme";

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem(KEY)) as
      | "dark"
      | "light"
      | null;
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("light", theme === "light");
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className={`w-9 h-9 grid place-items-center rounded-md border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
