"use client";
import { useEffect, useRef, useState } from "react";
import { coachIdeas, coachWorld } from "@/lib/ai-client";
import type { IdeaFrom, Session, Spark } from "@/lib/types";
import type { Update } from "./Project";
import { Button, TextWithMic } from "./ui";

const TAG: Record<IdeaFrom, string> = { pip: "From Pip", you: "Your idea", remix: "Remixed by you" };
const NOTE = ["bg-yellow-100 border-yellow-300", "bg-sky-100 border-sky-300", "bg-green-100 border-green-300", "bg-violet-100 border-violet-300", "bg-rose-100 border-rose-300"];
const SMALL = "rounded-lg border-2 border-stone-300 bg-white px-3 py-1 text-sm font-bold hover:border-orange-400";

/** Part 1: Pip suggests ideas for the goal; the student picks, remixes or adds their own, and keeps one favorite. */
export function IdeaLab({ session, active, update, onBuild }: {
  session: Session;
  active: boolean;
  update: Update;
  onBuild: (seed: NonNullable<Session["seed"]>) => void;
}) {
  const { id, topic, conditions, sparks, fav } = session;
  const [busy, setBusy] = useState<"world" | "ideas" | null>(null);
  const [error, setError] = useState<"world" | "ideas" | null>(null);
  const [own, setOwn] = useState("");
  const [extra, setExtra] = useState("");
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const asked = useRef(false);

  /** Applies a change only if this project is still the open one. */
  const change = (fn: (s: Session) => Partial<Session>) => update((s) => (s.id === id ? { ...s, ...fn(s) } : s));
  const add = (s: Session, texts: string[], from: IdeaFrom) => ({
    sparks: [...s.sparks, ...texts.map((text, i): Spark => ({ id: s.nextSpark + i, text, from }))],
    nextSpark: s.nextSpark + texts.length,
  });

  async function loadWorld() {
    setBusy("world"); setError(null);
    try {
      const r = await coachWorld(topic);
      change((s) => ({ conditions: { ...s.conditions, intro: r.intro, options: [...new Set([...r.conditions.slice(0, 6), ...s.conditions.options])] } }));
    } catch (e) { console.error(e); setError("world"); }
    setBusy(null);
  }

  async function suggest() {
    setBusy("ideas"); setError(null);
    try {
      const have = sparks.map((s) => s.text);
      const r = await coachIdeas(topic, conditions.picked, have);
      change((s) => {
        const seen = new Set(s.sparks.map((x) => x.text.toLowerCase()));
        return add(s, r.ideas.slice(0, 6).filter((t) => !seen.has(t.toLowerCase())), "pip");
      });
    } catch (e) { console.error(e); setError("ideas"); }
    setBusy(null);
  }

  useEffect(() => {
    if (!active || asked.current || conditions.options.length) return;
    asked.current = true;
    void loadWorld();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const toggle = (w: string) => change((s) => {
    const p = s.conditions.picked;
    return { conditions: { ...s.conditions, picked: p.includes(w) ? p.filter((x) => x !== w) : [...p, w] } };
  });
  function addCondition() {
    const w = extra.trim(); if (!w) return;
    change((s) => ({ conditions: { ...s.conditions, options: [...new Set([...s.conditions.options, w])], picked: [...new Set([...s.conditions.picked, w])] } }));
    setExtra("");
  }
  function addOwn() {
    const t = own.trim(); if (!t) return;
    change((s) => add(s, [t], "you"));
    setOwn("");
  }
  function saveRemix() {
    if (!editing) return;
    const text = editing.text.trim(), target = editing.id;
    if (text) change((s) => ({ sparks: s.sparks.map((x) => (x.id !== target || x.text === text ? x : { ...x, text, from: x.from === "you" ? "you" : "remix" })) }));
    setEditing(null);
  }

  const favorite = sparks.find((s) => s.id === fav);
  const building = !!favorite && session.seed?.text === favorite.text;

  return (
    <>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-8 pb-32">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-600">What you want to make or change</p>
          <h1 className="text-3xl font-bold">{topic}</h1>
        </div>

        <section className="flex flex-col gap-3 rounded-2xl border-2 border-stone-200 bg-white p-5">
          <h2 className="text-xl font-bold">🦉 Which of these are true?</h2>
          <p className="text-stone-600" aria-live="polite">{busy === "world" ? "Pip is thinking about your world…" : conditions.intro || "Add anything your idea has to work with."}</p>
          <div className="flex flex-wrap gap-2">
            {conditions.options.map((w) => {
              const on = conditions.picked.includes(w);
              return <button key={w} aria-pressed={on} onClick={() => toggle(w)} className={`rounded-full border-2 px-3 py-1 text-sm font-bold ${on ? "border-orange-600 bg-orange-100" : "border-orange-300 hover:bg-orange-50"}`}>{on ? "✓ " : ""}{w}</button>;
            })}
          </div>
          {error === "world" && <p className="text-sm text-red-700">Pip got stuck. <button className="underline" onClick={() => void loadWorld()}>Try again</button></p>}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addCondition(); }}>
            <input aria-label="Add your own condition" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Or add your own" className="min-w-0 flex-1 rounded-xl border-2 border-stone-300 px-3 py-1.5 outline-none focus:border-orange-400" />
            <button className={SMALL} disabled={!extra.trim()}>Add</button>
          </form>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Ideas</h2>
            <Button disabled={!!busy} onClick={() => void suggest()}>{busy === "ideas" ? "Pip is thinking…" : sparks.some((s) => s.from !== "you") ? "✨ More ideas" : "✨ Suggest ideas"}</Button>
          </div>
          {error === "ideas" && <p className="text-sm text-red-700" role="alert">Pip could not think of ideas just now. Try again in a moment.</p>}
          {!sparks.length && <p className="rounded-2xl border-2 border-dashed border-stone-300 p-6 text-center text-stone-600">No ideas yet. Ask Pip to suggest some, or write your own below.</p>}
          <ul className="grid gap-3 sm:grid-cols-2" aria-live="polite">
            {sparks.map((s) => (
              <li key={s.id} className={`flex animate-pop flex-col gap-3 rounded-2xl border-2 p-4 ${NOTE[s.id % NOTE.length]} ${s.id === fav ? "ring-4 ring-orange-500" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <small className="text-xs font-bold uppercase tracking-wider text-stone-600">{TAG[s.from]}</small>
                  <button aria-label={`Remove idea: ${s.text}`} className="px-1 text-stone-500 hover:text-stone-900" onClick={() => change((x) => ({ sparks: x.sparks.filter((y) => y.id !== s.id), fav: x.fav === s.id ? null : x.fav }))}>✕</button>
                </div>
                {editing?.id === s.id ? (
                  <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); saveRemix(); }}>
                    <textarea autoFocus aria-label="Remix this idea" rows={3} value={editing.text} onChange={(e) => setEditing({ id: s.id, text: e.target.value })} className="rounded-xl border-2 border-orange-400 bg-white px-3 py-2" />
                    <div className="flex gap-2"><button className={SMALL}>Save</button><button type="button" className={SMALL} onClick={() => setEditing(null)}>Cancel</button></div>
                  </form>
                ) : (
                  <>
                    <p className="flex-1 text-lg font-semibold leading-snug">{s.text}</p>
                    <div className="flex gap-2">
                      <button aria-pressed={s.id === fav} className={s.id === fav ? "rounded-lg border-2 border-orange-600 bg-orange-500 px-3 py-1 text-sm font-bold text-white" : SMALL} onClick={() => change((x) => ({ fav: x.fav === s.id ? null : s.id }))}>{s.id === fav ? "★ Favorite" : "☆ Make favorite"}</button>
                      <button className={SMALL} onClick={() => setEditing({ id: s.id, text: s.text })}>✎ Remix</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <TextWithMic value={own} onChange={setOwn} onSubmit={addOwn} placeholder="Add your own idea…" />
            <button className={`${SMALL} self-end disabled:opacity-50`} disabled={!own.trim()} onClick={addOwn}>Add my idea</button>
          </div>
        </section>
      </main>

      {active && favorite && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-orange-300 bg-white px-5 py-3 shadow-lg">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 flex-1 basis-60"><span className="text-xs font-bold uppercase tracking-wider text-orange-600">Your favorite</span><br /><b>{favorite.text}</b></p>
            <Button onClick={() => onBuild({ text: favorite.text, from: favorite.from })}>{building ? "Continue building →" : "Build this idea →"}</Button>
          </div>
        </div>
      )}
    </>
  );
}
