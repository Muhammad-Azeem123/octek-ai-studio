// Temporary client-side auth. Replace with real backend later.
const LS_AUTH = "octek-auth-session";
const LS_USERS = "octek-auth-users";

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
  const e = email.trim().toLowerCase();
  let valid = e === ALLOWED_EMAIL && password === ALLOWED_PASSWORD;
  if (!valid) {
    try {
      const raw = localStorage.getItem(LS_USERS);
      const users = raw ? (JSON.parse(raw) as { email: string; password: string }[]) : [];
      valid = users.some((u) => u.email === e && u.password === password);
    } catch {}
  }
  if (!valid) return null;
  const session: AuthSession = { email: e, loggedInAt: Date.now() };
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


interface StoredUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  createdAt: number;
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(LS_USERS);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(LS_USERS, JSON.stringify(users));
  } catch {}
}

export function signup(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const first = firstName.trim();
  const last = lastName.trim();
  const e = email.trim().toLowerCase();
  if (!first || !last || !e || !password) {
    return { ok: false, error: "First name, last name, email, and password are required." };
  }
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  const users = readUsers();
  if (users.some((u) => u.email === e) || e === ALLOWED_EMAIL) {
    return { ok: false, error: "An account with this email already exists." };
  }
  users.push({
    email: e,
    password,
    firstName: first,
    lastName: last,
    name: `${first} ${last}`,
    createdAt: Date.now(),
  });
  writeUsers(users);
  const session: AuthSession = { email: e, loggedInAt: Date.now() };
  try {
    localStorage.setItem(LS_AUTH, JSON.stringify(session));
  } catch {}
  return { ok: true, session };
}
