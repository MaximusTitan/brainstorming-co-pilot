"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { deleteBoard, listBoards, type BoardRow } from "@/lib/boards";
import { Button, Header, TextWithMic } from "./ui";

const IDEAS = ["Help kids learn when there is no electricity", "A bag that reminds me of my homework", "Save water at our school", "A game that teaches fractions"];

export function StartScreen({
  onStart,
  hasSaved,
  onContinue,
  user,
  onSignOut,
  onOpenBoard,
}: {
  user: User | null;
  onSignOut: () => void;
  onOpenBoard: (id: string) => void;
  onStart: (topic: string) => void;
  hasSaved: boolean;
  onContinue: () => void;
}) {
  const [topic, setTopic] = useState("");
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
            {user && (
              <>
                <span className="hidden sm:inline text-sm text-stone-600">{user.email}</span>
                <Button variant="ghost" className="!py-1.5 text-sm" onClick={onSignOut}>Sign out</Button>
              </>
            )}
          </>
        }
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 flex flex-col gap-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-center">What do you want to make or change?</h1>
        <p className="text-center text-stone-600 text-lg">Tell Pip. First find an idea you love, then work out what it takes to make it real.</p>
        <TextWithMic
          value={topic}
          onChange={setTopic}
          onSubmit={() => topic.trim() && onStart(topic.trim())}
          placeholder={'Type or say anything, like "help kids keep learning without electricity"…'}
        />
        <div className="flex flex-wrap gap-2 justify-center">
          {IDEAS.map((i) => (
            <button key={i} onClick={() => setTopic(i)} className="rounded-full border-2 border-yellow-400 bg-yellow-100 px-3 py-1 text-sm font-medium hover:bg-yellow-200">{i}</button>
          ))}
        </div>
        <Button className="self-center text-lg" disabled={!topic.trim()} onClick={() => onStart(topic.trim())}>
          Let&apos;s start! 🧠
        </Button>
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
      </main>
    </>
  );
}
