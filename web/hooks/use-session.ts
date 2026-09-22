"use client";

import { useEffect, useState } from "react";
import { createSession, getSession } from "@/lib/api/client";
import { rememberSession } from "@/lib/session-store";
import type { QrPayload, Session } from "@/types/session";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [qrPayload, setQrPayload] = useState<QrPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    createSession()
      .then((created) => {
        if (stopped) return;
        setSession(created.session);
        setQrPayload(created.qrPayload);
        rememberSession({
          sessionId: created.session.sessionId,
          token: created.qrPayload.token,
        });
        timer = setInterval(() => {
          getSession(created.session.sessionId, created.qrPayload.token)
            .then((next) => {
              if (!stopped) setSession(next);
            })
            .catch((cause: unknown) => {
              if (!stopped) setError(cause instanceof Error ? cause.message : "Lost the session.");
            });
        }, 2000);
      })
      .catch((cause: unknown) => {
        if (!stopped) setError(cause instanceof Error ? cause.message : "Could not start a session.");
      });

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return { session, qrPayload, error };
}
