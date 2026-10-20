"use client";
import { useState } from "react";
import { loadBoard } from "@/lib/boards";
import { useAuth } from "@/lib/use-auth";
import { useSession } from "@/lib/use-session";
import { AuthScreen } from "./AuthScreen";
import { BoardScreen } from "./BoardScreen";
import { ChatScreen } from "./ChatScreen";
import { DocScreen } from "./DocScreen";
import { RefineScreen } from "./RefineScreen";
import { ShareScreen } from "./ShareScreen";
import { StartScreen } from "./StartScreen";
import { emptySession, type ProjectType } from "@/lib/types";

type Screen = "auth" | "start" | "chat" | "board" | "refine" | "doc" | "share";

export function App() {
  const auth = useAuth();
  const { session, update, replace, reset, ready, saveError } = useSession(auth.user);
  const [screen, setScreen] = useState<Screen>("start");
  const [pending, setPending] = useState<{ topic: string; type: ProjectType } | null>(null);
  if (!ready) return null;

  const home = () => {
    setPending(null);
    setScreen("start");
  };

  function begin(topic: string, type: ProjectType) {
    update({ ...emptySession, id: crypto.randomUUID(), topic, type });
    setPending(null);
    setScreen("chat");
  }

  const banner = saveError ? (
    <p className="bg-red-100 px-4 py-1 text-center text-sm text-red-700">Couldn&apos;t save to your account ({saveError}). Your work is still safe on this device.</p>
  ) : null;

  const screenEl = (() => { switch (screen) {
    case "auth":
      return <AuthScreen auth={auth} pendingTopic={pending?.topic} onHome={home} onDone={() => (pending ? begin(pending.topic, pending.type) : home())} />;
    case "start":
      return (
        <StartScreen
          user={auth.user}
          authEnabled={auth.enabled}
          onSignIn={() => setScreen("auth")}
          onSignOut={async () => { await auth.signOut(); reset(); }}
          onOpenBoard={async (id) => {
            const s = await loadBoard(id);
            if (s) { replace(s); setScreen(s.doc ? "doc" : "board"); }
          }}
          hasSaved={session.ideas.length > 0 || session.messages.length > 0}
          onContinue={() => setScreen(session.doc ? "doc" : "board")}
          onStart={(topic, type) => {
            if (auth.enabled && !auth.user) {
              setPending({ topic, type });
              setScreen("auth");
            } else begin(topic, type);
          }}
        />
      );
    case "chat":
      return <ChatScreen session={session} update={update} onHome={home} onBoard={() => setScreen("board")} />;
    case "board":
      return (
        <BoardScreen
          session={session}
          update={update}
          onHome={home}
          onChat={() => setScreen("chat")}
          onGrow={(id) => { update({ activeIdeaId: id }); setScreen("refine"); }}
        />
      );
    case "refine":
      return (
        <RefineScreen
          key={session.activeIdeaId}
          session={session}
          update={update}
          onHome={home}
          onPick={(id) => update({ activeIdeaId: id })}
          onDone={() => setScreen("doc")}
        />
      );
    case "doc":
      return <DocScreen session={session} update={update} onHome={home} onBack={() => setScreen("refine")} onExport={() => setScreen("share")} />;
    case "share":
      return <ShareScreen session={session} onHome={home} onBack={() => setScreen("doc")} onNew={home} />;
  } })();

  return (
    <>
      {banner}
      {screenEl}
    </>
  );
}
