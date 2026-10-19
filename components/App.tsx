"use client";
import { useState } from "react";
import { useSession } from "@/lib/use-session";
import { BoardScreen } from "./BoardScreen";
import { ChatScreen } from "./ChatScreen";
import { DocScreen } from "./DocScreen";
import { RefineScreen } from "./RefineScreen";
import { ShareScreen } from "./ShareScreen";
import { StartScreen } from "./StartScreen";
import { emptySession } from "@/lib/types";

type Screen = "start" | "chat" | "board" | "refine" | "doc" | "share";

export function App() {
  const { session, update, ready } = useSession();
  const [screen, setScreen] = useState<Screen>("start");
  if (!ready) return null;

  const home = () => setScreen("start");

  switch (screen) {
    case "start":
      return (
        <StartScreen
          hasSaved={session.ideas.length > 0 || session.messages.length > 0}
          onContinue={() => setScreen(session.doc ? "doc" : "board")}
          onStart={(topic, type) => {
            update({ ...emptySession, topic, type });
            setScreen("chat");
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
  }
}
