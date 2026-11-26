"use client";
import { useState } from "react";
import { loadBoard } from "@/lib/boards";
import { useAuth } from "@/lib/use-auth";
import { useSession } from "@/lib/use-session";
import { newSession } from "@/lib/types";
import { AuthScreen } from "./AuthScreen";
import { Landing } from "./Landing";
import { StartScreen } from "./StartScreen";
import { Project } from "./Project";

export function App() {
  const auth = useAuth();
  const { session, update, replace, reset, ready, saveError } = useSession(auth.user);
  const [authMode, setAuthMode] = useState<"in" | "up" | null>(null);
  const [screen, setScreen] = useState<"start" | "project">("start");
  // Signed-out visitors see the landing page; sign-in / sign-up opens from it.
  if (!ready || auth.loading) return null;
  if (auth.enabled && !auth.user) {
    return authMode ? (
      <AuthScreen key={authMode} auth={auth} initialMode={authMode} onHome={() => setAuthMode(null)} onDone={() => { setAuthMode(null); setScreen("start"); }} />
    ) : (
      <Landing onSignIn={() => setAuthMode("in")} onSignUp={() => setAuthMode("up")} />
    );
  }

  const banner = saveError ? (
    <p className="bg-red-100 px-4 py-1 text-center text-sm text-red-700">Couldn&apos;t save to your account ({saveError}). Your work is still safe on this device.</p>
  ) : null;

  return (
    <>
      {banner}
      {screen === "project" ? (
        // key: a new session id remounts both parts with fresh state
        <Project key={session.id} session={session} update={update} onHome={() => setScreen("start")} />
      ) : (
        <StartScreen
          user={auth.user}
          onSignOut={async () => { await auth.signOut(); reset(); setScreen("start"); }}
          onOpenBoard={async (id) => {
            const s = await loadBoard(id);
            if (s) { replace({ ...s, id }); setScreen("project"); }
          }}
          hasSaved={!!(session.msgs.length || session.sparks.length || session.seed)}
          onContinue={() => setScreen("project")}
          onStart={(topic) => { replace(newSession(topic, crypto.randomUUID())); setScreen("project"); }}
        />
      )}
    </>
  );
}
