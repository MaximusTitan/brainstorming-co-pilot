"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { emptySession, type Session } from "./types";

const KEY = "idea-pal-session-v1";
const ID_KEY = "idea-pal-session-id";

function getSessionId() {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Session state: localStorage for instant loads, Supabase (via /api/sessions) for durable saves. */
export function useSession() {
  const [session, setSession] = useState<Session>(emptySession);
  const [ready, setReady] = useState(false);
  const idRef = useRef<string | null>(null);
  const remoteOk = useRef(true);

  // Hydrate after mount (localStorage isn't available during SSR), then try the remote copy.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    idRef.current = getSessionId();
    let local: Session | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) local = { ...emptySession, ...JSON.parse(raw) };
    } catch {}
    if (local) setSession(local);
    setReady(true);

    const id = idRef.current;
    if (!id || local) return;
    // Nothing local (new browser/cleared storage): restore from Supabase if we have it.
    fetch(`/api/sessions/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => row?.data && setSession({ ...emptySession, ...row.data }))
      .catch(() => {});
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(session));
    } catch {}

    const id = idRef.current;
    const hasContent = session.topic || session.ideas.length;
    if (!id || !hasContent || !remoteOk.current) return;
    const t = setTimeout(() => {
      fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      })
        .then((r) => {
          if (r.status === 503) remoteOk.current = false; // Supabase not configured: stay local-only
        })
        .catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
  }, [session, ready]);

  const update = useCallback((patch: Partial<Session> | ((s: Session) => Session)) => {
    setSession((s) => (typeof patch === "function" ? patch(s) : { ...s, ...patch }));
  }, []);

  const reset = useCallback(() => setSession(emptySession), []);

  return { session, update, reset, ready };
}
