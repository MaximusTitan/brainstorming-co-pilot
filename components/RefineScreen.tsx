"use client";
import { useEffect, useState } from "react";
import { askDocument, askRefine } from "@/lib/ai-client";
import type { Session } from "@/lib/types";
import { Button, Header, TextWithMic, cardBg } from "./ui";
import { ChatHelper } from "./ChatHelper";

const KEYS = ["what", "why", "how"] as const;
const COLOR = { what: "bg-sky-200", why: "bg-green-200", how: "bg-orange-200" };

export function RefineScreen({
  session,
  update,
  onHome,
  onDone,
  onPick,
}: {
  session: Session;
  update: (p: (s: Session) => Session) => void;
  onHome: () => void;
  onDone: () => void;
  onPick: (id: string) => void;
}) {
  const idea = session.ideas.find((i) => i.id === session.activeIdeaId);
  const [qs, setQs] = useState<{ what: string; why: string; how: string } | null>(null);
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!idea) return;
    askRefine({ topic: session.topic, idea: idea.text })
      .then((r) => { setQs(r.questions); setHint(r.hint); })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?.id]);

  if (!idea) return null;
  const answered = KEYS.filter((k) => idea.answers[k].trim()).length;

  const setAns = (k: (typeof KEYS)[number], v: string) => {
    const next = { ...idea.answers, [k]: v };
    update((s) => ({ ...s, ideas: s.ideas.map((i) => (i.id === idea.id ? { ...i, answers: next } : i)) }));
  };

  async function make() {
    if (!idea) return;
    setBusy(true);
    setError("");
    try {
      const doc = await askDocument({ topic: session.topic, idea: idea.text, answers: idea.answers });
      update((s) => ({ ...s, doc }));
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oops, try again!");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header onHome={onHome} />
      <div className="mx-auto w-full max-w-6xl flex-1 p-4 grid md:grid-cols-[220px_1fr] lg:grid-cols-[220px_1fr_300px] gap-5">
        <aside className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold">Let&apos;s grow your idea 🌱</h1>
          <div className={`rounded-xl border-2 p-3 ${cardBg[idea.color]}`}>
            <p className="text-xs">Your idea</p>
            <p className="font-bold text-lg">{idea.text}</p>
          </div>
          <div>
            <p className="text-xs text-stone-600">Idea growth</p>
            <div className="h-3 rounded-full bg-stone-200 overflow-hidden">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${(answered / 3) * 100}%` }} />
            </div>
            <p className="text-xs text-stone-500">{answered} of 3 questions answered</p>
          </div>
          <p className="text-xs text-stone-600">Switch idea</p>
          {session.ideas.filter((i) => i.id !== idea.id).map((i) => (
            <button key={i.id} onClick={() => onPick(i.id)} className="text-left rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:border-orange-400">{i.text}</button>
          ))}
          <Button disabled={busy || !answered} onClick={make}>{busy ? "Writing…" : "Make my document 📄"}</Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </aside>
        <section className="flex flex-col gap-4">
          {KEYS.map((k) => (
            <div key={k} className="animate-pop rounded-2xl border-2 border-stone-300 bg-white p-3 flex flex-col gap-2">
              <p className="font-bold">
                <span className={`rounded px-2 py-0.5 text-xs mr-2 ${COLOR[k]}`}>{k.toUpperCase()}</span>
                {qs ? qs[k] : <span className="text-stone-400 animate-pulse">Thinking of a question…</span>}
              </p>
              <TextWithMic multiline value={idea.answers[k]} onChange={(v) => setAns(k, v)} placeholder="Type or talk…" />
            </div>
          ))}
          {hint && <p className="text-sm text-stone-600">Stuck? 🦉 {hint}</p>}
        </section>
        <div className="md:col-span-2 lg:col-span-1">
          <ChatHelper
            topic={session.topic}
            idea={idea.text}
            answers={idea.answers}
            onUseSuggestion={(f, t) => setAns(f, idea.answers[f].trim() ? `${idea.answers[f].trim()} ${t}` : t)}
          />
        </div>
      </div>
    </>
  );
}
