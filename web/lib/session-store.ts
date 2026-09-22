const key = "kru-session";

export type StoredSession = {
  sessionId: string;
  token: string;
};

export function rememberSession(value: StoredSession) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function readStoredSession(): StoredSession | null {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.sessionId || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}
