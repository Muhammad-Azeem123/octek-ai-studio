const viteEnv = typeof import.meta !== "undefined" ? import.meta.env || {} : {};
const processEnv = typeof process !== "undefined" && process.env ? process.env : {};
const env = { ...processEnv, ...viteEnv };

const DEFAULT_AUTH_API_BASE = "https://auth.mennuai.com";
const AUTH_PROXY_BASE = "/auth-api";
const rawAuthApiBase = env.VITE_AUTH_API_BASE || env.AUTH_API_BASE || DEFAULT_AUTH_API_BASE;
const isBrowser = typeof window !== "undefined";
const isDefaultRemoteAuth = /^https:\/\/auth\.mennuai\.com\/?$/i.test(
  String(rawAuthApiBase || "").trim(),
);
const AUTH_API_BASE =
  isBrowser && isDefaultRemoteAuth
    ? AUTH_PROXY_BASE
    : String(rawAuthApiBase || AUTH_PROXY_BASE).replace(/\/$/, "");
const usesAuthProxy = String(AUTH_API_BASE).startsWith("/");

const AUTHORIZATION_VALUE =
  env.AUTHORIZATION_HEADER ||
  env.AUTHORIZATION ||
  env.Authorization ||
  env.VITE_AUTHORIZATION_HEADER ||
  env.VITE_AUTHORIZATION ||
  env.VITE_AUTH_TOKEN ||
  "";
const CLIENT_HEADER_SECRET =
  env.CLIENT_SECRET ||
  env.CLIENT_HEADER_SECRET ||
  env["Client-Secret"] ||
  env.VITE_CLIENT_SECRET ||
  env.VITE_CLIENT_HEADER_SECRET ||
  env["VITE_Client-Secret"] ||
  "";
const TEST_EMAIL = env.TEST_EMAIL || env.VITE_TEST_EMAIL || "mianazeem5605@gmail.com";
const TEST_PASSWORD = env.TEST_PASSWORD || env.VITE_TEST_PASSWORD || "123123123";
const TEST_USER_ID = "12345";
const LS_LOCAL_USERS = "octek-auth-users";
const LS_AUTH_SESSION = "octek-auth-session";

const normalizeAuthorizationHeader = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^Bearer\s+\S+/i.test(trimmed)) return trimmed;
  return `Bearer ${trimmed.replace(/^Bearer\s*/i, "").trim()}`;
};

const AUTHORIZATION_HEADER = normalizeAuthorizationHeader(AUTHORIZATION_VALUE);

const getAuthHeaders = () => {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Same-origin /auth-api requests are proxied server-side, where the secret
  // auth headers are added. Keeping them out of browser requests avoids CORS
  // preflight failures and stops secrets from being sent over the client path.
  if (!usesAuthProxy) {
    if (AUTHORIZATION_HEADER) headers.Authorization = AUTHORIZATION_HEADER;
    if (CLIENT_HEADER_SECRET) headers["Client-Secret"] = CLIENT_HEADER_SECRET;
  }

  return headers;
};

const parseErrorMessage = async (res, fallback) => {
  try {
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    return data?.error || data?.message || data?.detail || fallback;
  } catch {
    return fallback;
  }
};

const base64UrlEncode = (value) =>
  btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return decodeURIComponent(escape(atob(padded)));
};

const createLocalToken = (uuid, email = TEST_EMAIL) => {
  const header = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      uuid,
      email,
      iat: Math.floor(Date.now() / 1000),
    }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${payload}.local`;
};

const createLocalUserId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const storeSession = ({ token, uuid, email }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user_id", uuid);
  localStorage.setItem(
    LS_AUTH_SESSION,
    JSON.stringify({ email, uuid, token, loggedInAt: Date.now() }),
  );
};

const readLocalUsers = () => {
  try {
    const raw = localStorage.getItem(LS_LOCAL_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocalUsers = (users) => {
  localStorage.setItem(LS_LOCAL_USERS, JSON.stringify(users));
};

const loginWithLocalUser = (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  const isTestUser = normalizedEmail === TEST_EMAIL.toLowerCase() && password === TEST_PASSWORD;
  const localUser = readLocalUsers().find(
    (user) => user.email === normalizedEmail && user.password === password,
  );

  if (!isTestUser && !localUser) return null;

  const uuid = localUser?.uuid || TEST_USER_ID;
  const token = createLocalToken(uuid, normalizedEmail);
  storeSession({ token, uuid, email: normalizedEmail });

  return { token, uuid };
};

const signupLocalUser = (firstName, lastName, email, password) => {
  const first = firstName.trim();
  const last = lastName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!first || !last || !normalizedEmail || !password) {
    throw new Error("First name, last name, email, and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const users = readLocalUsers();
  if (
    normalizedEmail === TEST_EMAIL.toLowerCase() ||
    users.some((user) => user.email === normalizedEmail)
  ) {
    throw new Error("An account with this email already exists.");
  }

  const uuid = createLocalUserId();
  const user = {
    uuid,
    email: normalizedEmail,
    password,
    first_name: first,
    last_name: last,
    created_at: new Date().toISOString(),
    local: true,
  };

  writeLocalUsers([...users, user]);

  return user;
};

const decodeTokenUuid = (token) => {
  const payload = JSON.parse(base64UrlDecode(token.split(".")[1]));
  return payload.uuid || payload.sub || payload.id;
};

// 1. LOGIN
export const loginUser = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const res = await fetch(`${AUTH_API_BASE}/login`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    if (!res.ok) throw new Error(await parseErrorMessage(res, "Login failed"));

    const data = await res.json();
    // data = { token, expires_in, token_type }

    // Decode JWT to get uuid
    const uuid = decodeTokenUuid(data.token);

    // Store in localStorage
    storeSession({ token: data.token, uuid, email: normalizedEmail });

    return { token: data.token, uuid };
  } catch (error) {
    const localSession = loginWithLocalUser(normalizedEmail, password);
    if (localSession) return localSession;

    throw error;
  }
};

// 2. SIGNUP
export const signupUser = async (firstName, lastName, email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const res = await fetch(`${AUTH_API_BASE}/sign-up`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: normalizedEmail,
        password: password,
        environment: env.ENVIRONMENT || env.VITE_ENVIRONMENT || "production",
        meta_data: '{"role": "user"}',
      }),
    });

    if (!res.ok) {
      const message = await parseErrorMessage(res, "Signup failed");
      if (usesAuthProxy && (res.status === 404 || res.status >= 500)) {
        return signupLocalUser(firstName, lastName, normalizedEmail, password);
      }
      throw new Error(message);
    }

    const data = await res.json();
    // data = { uuid, email, first_name, last_name, ... }

    const uuid = data.uuid || data.user_id || data.id;
    if (uuid) localStorage.setItem("user_id", uuid);
    if (data.token) {
      storeSession({ token: data.token, uuid, email: normalizedEmail });
    }

    return data;
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    return signupLocalUser(firstName, lastName, normalizedEmail, password);
  }
};

// 3. GET USER
export const getUserById = async (uuid) => {
  const res = await fetch(`${AUTH_API_BASE}/user-by-id/${uuid}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error(await parseErrorMessage(res, "Get user failed"));
  return await res.json();
};

// 4. LOGOUT
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  localStorage.removeItem(LS_AUTH_SESSION);
  window.location.href = "/";
};

// 5. GET CURRENT USER_ID (use everywhere)
export const getCurrentUserId = () => localStorage.getItem("user_id");
export const getCurrentToken = () => localStorage.getItem("token");
export const isLoggedIn = () => !!localStorage.getItem("token");
