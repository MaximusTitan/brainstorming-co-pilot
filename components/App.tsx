"use client";
import { useState } from "react";
import { loadBoard } from "@/lib/boards";
import { useAuth } from "@/lib/use-auth";
import { useSession } from "@/lib/use-session";
import { newSession } from "@/lib/types";
import { AuthScreen } from "./AuthScreen";
import { Landing } from "./Landing";
import { StartScreen } from "./StartScreen";
import { Studio } from "./Studio";
import { Button } from "./ui";

export function App() {
  const auth = useAuth();
  const { session, replace, reset, ready, saveError } = useSession(auth.user);
  const [authMode, setAuthMode] = useState<"in" | "up" | null>(null);
  const [screen, setScreen] = useState<"start" | "studio">("start");
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
      {screen === "studio" ? (
        // key: a new session id remounts the studio with fresh state
        <Studio key={session.id} session={session} onChange={replace} onHome={() => setScreen("start")}
          right={<Button variant="ghost" className="!py-1.5 text-sm" onClick={() => setScreen("start")}>My boards</Button>} />
      ) : (
        <StartScreen
          user={auth.user}
          onSignOut={async () => { await auth.signOut(); reset(); setScreen("start"); }}
          onOpenBoard={async (id) => {
            const s = await loadBoard(id);
            if (s) { replace({ ...s, id }); setScreen("studio"); }
          }}
          hasSaved={!!session.msgs.length}
          onContinue={() => setScreen("studio")}
          onStart={(topic) => { replace(newSession(topic, crypto.randomUUID())); setScreen("studio"); }}
        />
      )}
    </>
  );
}
