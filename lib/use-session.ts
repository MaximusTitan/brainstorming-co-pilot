"use client";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { saveBoard } from "./boards";
import { emptySession, type Session } from "./types";

const KEY = "idea-pal-session-v1";

/** Working copy lives in localStorage; when signed in it's also saved to the user's boards in Supabase. */
export function useSession(user: User | null) {
  const [session, setSession] = useState<Session>(emptySession);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Hydrate after mount (localStorage isn't available during SSR).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = { ...emptySession, ...JSON.parse(raw) } as Session;
        setSession({ ...s, id: s.id || crypto.randomUUID() });
      }
    } catch {}
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(session));
    } catch {}
    if (!user || !session.id || !(session.topic || session.ideas.length)) return;
    const t = setTimeout(() => {
      saveBoard(session).then(
        () => setSaveError(false),
        () => setSaveError(true),
      );
    }, 1000);
    return () => clearTimeout(t);
  }, [session, ready, user]);

  const update = useCallback((patch: Partial<Session> | ((s: Session) => Session)) => {
    setSession((s) => (typeof patch === "function" ? patch(s) : { ...s, ...patch }));
  }, []);

  const replace = useCallback((s: Session) => setSession(s), []);
  const reset = useCallback(() => setSession(emptySession), []);

  return { session, update, replace, reset, ready, saveError };
}
