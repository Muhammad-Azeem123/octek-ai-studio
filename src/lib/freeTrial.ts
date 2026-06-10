export const FREE_PROMPT_LIMIT = 2;

/** Shared demo key — using this does not count as bringing your own key. */
export const FREE_TRIAL_DEMO_API_KEY = "AIzaSyA_wVvnlQiPMK2pBwVaEAuKmbxrHvcWDg8";

const LEGACY_PROMPT_COUNT = "octek-prompt-count";
const LEGACY_USER_KEY = "octek-user-verified-key";
const LEGACY_USER_PROVIDER = "octek-user-verified-provider";

export function isOwnVerifiedApiKey(key: string | null | undefined): boolean {
  if (!key?.trim()) return false;
  return key.trim() !== FREE_TRIAL_DEMO_API_KEY;
}

function clearLegacyTrialStorage() {
  try {
    localStorage.removeItem(LEGACY_PROMPT_COUNT);
    localStorage.removeItem(LEGACY_USER_KEY);
    localStorage.removeItem(LEGACY_USER_PROVIDER);
  } catch {}
}

function promptCountKey(userId: string) {
  return `octek-prompt-count:${userId}`;
}

function userKeyKey(userId: string) {
  return `octek-user-verified-key:${userId}`;
}

function userProviderKey(userId: string) {
  return `octek-user-verified-provider:${userId}`;
}

export function getPromptCount(userId: string | null): number {
  if (!userId) return 0;
  try {
    const scoped = localStorage.getItem(promptCountKey(userId));
    if (scoped != null) {
      const n = parseInt(scoped, 10);
      return Number.isNaN(n) ? 0 : Math.max(0, n);
    }
    const legacy = localStorage.getItem(LEGACY_PROMPT_COUNT);
    if (legacy != null) {
      const n = parseInt(legacy, 10);
      const count = Number.isNaN(n) ? 0 : Math.max(0, n);
      setPromptCount(userId, count);
      localStorage.removeItem(LEGACY_PROMPT_COUNT);
      return count;
    }
  } catch {}
  return 0;
}

export function setPromptCount(userId: string, count: number) {
  try {
    localStorage.setItem(promptCountKey(userId), String(Math.max(0, count)));
  } catch {}
}

export function incrementPromptCount(userId: string): number {
  const next = getPromptCount(userId) + 1;
  setPromptCount(userId, next);
  return next;
}

/**
 * Initialise the free trial for a newly registered account.
 *
 * IMPORTANT: only resets the prompt count when no record exists yet for this
 * userId. If a count is already stored (e.g. because the user partially used
 * their trial before a page reload or error) we leave it untouched — otherwise
 * a re-login / error-recovery path can silently reset the counter back to 0.
 */
export function grantFreeTrial(userId: string) {
  try {
    // Only write the initial count when this user has never had one stored.
    const existing = localStorage.getItem(promptCountKey(userId));
    if (existing === null) {
      // Truly new user — initialise to 0 and clear any legacy keys.
      setPromptCount(userId, 0);
      localStorage.removeItem(userKeyKey(userId));
      localStorage.removeItem(userProviderKey(userId));
      clearLegacyTrialStorage();
    }
    // else: count already exists — do NOT overwrite it.
  } catch {}
}

function normalizeOwnKey(key: string | null): string | null {
  return isOwnVerifiedApiKey(key) ? key!.trim() : null;
}

export function getUserVerifiedKey(userId: string | null): string | null {
  if (!userId) return null;
  try {
    const scoped = localStorage.getItem(userKeyKey(userId));
    if (scoped != null) {
      const own = normalizeOwnKey(scoped);
      if (!own) {
        localStorage.removeItem(userKeyKey(userId));
        localStorage.removeItem(userProviderKey(userId));
      }
      return own;
    }
    const legacy = localStorage.getItem(LEGACY_USER_KEY);
    if (legacy != null) {
      const legacyProv = localStorage.getItem(LEGACY_USER_PROVIDER);
      clearLegacyTrialStorage();
      const own = normalizeOwnKey(legacy);
      if (own) {
        localStorage.setItem(userKeyKey(userId), own);
        if (legacyProv) localStorage.setItem(userProviderKey(userId), legacyProv);
      }
      return own;
    }
  } catch {}
  return null;
}

/** Read trial state once (for initial React state — avoids badge flash). */
export function loadTrialState(userId: string | null): {
  ownVerifiedKey: string | null;
  promptCount: number;
} {
  if (!userId) return { ownVerifiedKey: null, promptCount: 0 };
  return {
    ownVerifiedKey: getUserVerifiedKey(userId),
    promptCount: getPromptCount(userId),
  };
}

export function getUserVerifiedProvider(userId: string | null): string | null {
  if (!userId) return null;
  try {
    return localStorage.getItem(userProviderKey(userId));
  } catch {}
  return null;
}

export function setUserVerifiedKey(userId: string, key: string, provider: string) {
  if (!isOwnVerifiedApiKey(key)) return;
  try {
    localStorage.setItem(userKeyKey(userId), key.trim());
    localStorage.setItem(userProviderKey(userId), provider);
  } catch {}
}
