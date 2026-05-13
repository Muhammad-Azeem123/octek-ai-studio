// Temporary client-side auth. Replace with real backend later.
const LS_AUTH = "octek-auth-session";

export const ALLOWED_EMAIL = "mianazeem5605@gmail.com";
export const ALLOWED_PASSWORD = "123123123";

export interface AuthSession {
  email: string;
  loggedInAt: number;
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(LS_AUTH);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getSession();
}

export function login(email: string, password: string): AuthSession | null {
  if (email.trim().toLowerCase() !== ALLOWED_EMAIL || password !== ALLOWED_PASSWORD) {
    return null;
  }
  const session: AuthSession = { email: ALLOWED_EMAIL, loggedInAt: Date.now() };
  try {
    localStorage.setItem(LS_AUTH, JSON.stringify(session));
  } catch {}
  return session;
}

export function logout(): void {
  try {
    localStorage.removeItem(LS_AUTH);
  } catch {}
}
