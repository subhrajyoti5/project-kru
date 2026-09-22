import type { CreatedSession, Session } from "@/types/session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // Fall through to the status line.
  }
  return `Request failed (${response.status}).`;
}

export async function createSession(): Promise<CreatedSession> {
  const response = await fetch(`${apiUrl}/sessions`, { method: "POST" });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as CreatedSession;
}

export type SignalMessage = {
  id: number;
  role: string;
  type: string;
  payload: Record<string, unknown>;
};

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function getSession(sessionId: string, token: string): Promise<Session> {
  const response = await fetch(`${apiUrl}/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { session: Session };
  return body.session;
}

export async function markConnected(sessionId: string, token: string): Promise<void> {
  const response = await fetch(`${apiUrl}/sessions/${sessionId}/connected`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function postSignal(
  sessionId: string,
  token: string,
  type: "offer" | "answer" | "ice" | "bye",
  payload: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(`${apiUrl}/sessions/${sessionId}/signals`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ role: "browser", type, payload }),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function readSignals(
  sessionId: string,
  token: string,
  after: number,
): Promise<SignalMessage[]> {
  const response = await fetch(`${apiUrl}/sessions/${sessionId}/signals?after=${after}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { signals: SignalMessage[] };
  return body.signals;
}
