"use client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabase } from "./supabase-browser";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getSupabase();
    if (!db) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    db.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data } = db.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    enabled: !!getSupabase(),
    async signIn(email: string, password: string) {
      const { error } = await getSupabase()!.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    /** Returns an error message, or "check-email" when the project requires email confirmation. */
    async signUp(email: string, password: string) {
      const { data, error } = await getSupabase()!.auth.signUp({ email, password });
      if (error) return error.message;
      return data.session ? null : "check-email";
    },
    async signOut() {
      await getSupabase()?.auth.signOut();
    },
  };
}
