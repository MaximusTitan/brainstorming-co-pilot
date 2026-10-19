"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { deleteBoard, listBoards, type BoardRow } from "@/lib/boards";
import type { ProjectType } from "@/lib/types";
import { Button, Header, TextWithMic } from "./ui";

const TYPES: { t: ProjectType; icon: string; cls: string }[] = [
  { t: "Story", icon: "📖", cls: "bg-sky-200 border-sky-400" },
  { t: "Science project", icon: "🔬", cls: "bg-green-200 border-green-400" },
  { t: "Invention", icon: "💡", cls: "bg-yellow-200 border-yellow-400" },
  { t: "Event", icon: "🎉", cls: "bg-pink-200 border-pink-400" },
];

export function StartScreen({
  onStart,
  hasSaved,
  onContinue,
  user,
  authEnabled,
  onSignIn,
  onSignOut,
  onOpenBoard,
}: {
  user: User | null;
  authEnabled: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenBoard: (id: string) => void;
  onStart: (topic: string, type: ProjectType) => void;
  hasSaved: boolean;
  onContinue: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState<ProjectType>("Invention");
  const [boards, setBoards] = useState<BoardRow[]>([]);
  const uid = user?.id;

  useEffect(() => {
    if (!uid) return;
    listBoards().then(setBoards, () => {});
  }, [uid]);
  const shown = uid ? boards : [];
  return (
    <>
      <Header
        onHome={() => {}}
        right={
          <>
            {hasSaved && <Button variant="ghost" className="!py-1.5 text-sm" onClick={onContinue}>Current project</Button>}
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-stone-600">{user.email}</span>
                <Button variant="ghost" className="!py-1.5 text-sm" onClick={onSignOut}>Sign out</Button>
              </>
            ) : (
              authEnabled && <Button variant="ghost" className="!py-1.5 text-sm" onClick={onSignIn}>Sign in</Button>
            )}
          </>
        }
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 flex flex-col gap-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-center">What do you want to think about?</h1>
        <TextWithMic
          value={topic}
          onChange={setTopic}
          onSubmit={() => topic.trim() && onStart(topic.trim(), type)}
          placeholder={'Type or say anything, like "a gadget to help me remember my homework"…'}
        />
        <p className="font-medium">Or pick a project type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TYPES.map(({ t, icon, cls }) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-2xl border-2 p-4 text-center font-semibold transition ${cls} ${type === t ? "ring-4 ring-orange-400 scale-105" : ""}`}
            >
              <div className="text-4xl mb-1">{icon}</div>
              {t}
            </button>
          ))}
        </div>
        <Button className="self-center text-lg" disabled={!topic.trim()} onClick={() => onStart(topic.trim(), type)}>
          Let&apos;s think! 🧠
        </Button>
        <p className="text-center text-sm text-stone-500">Not sure? Just tell me anything!</p>
        {shown.length > 0 && (
          <section className="mt-4">
            <h2 className="font-bold mb-2">My saved boards</h2>
            <ul className="flex flex-col gap-2">
              {shown.map((b) => (
                <li key={b.id} className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2">
                  <button className="flex-1 text-left" onClick={() => onOpenBoard(b.id)}>
                    <span className="font-semibold">{b.title || "Untitled"}</span>
                    <span className="ml-2 text-xs text-stone-500">{new Date(b.updated_at).toLocaleDateString()}</span>
                  </button>
                  <button aria-label="Delete board" onClick={() => { if (confirm("Delete this board?")) deleteBoard(b.id).then(() => setBoards((x) => x.filter((y) => y.id !== b.id))); }}>🗑️</button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {!user && authEnabled && (
          <p className="text-center text-sm"><button className="underline" onClick={onSignIn}>Sign in</button> to save your boards.</p>
        )}
      </main>
    </>
  );
}
