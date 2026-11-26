"use client";
import { useState } from "react";
import { newSession, type Part, type Session } from "@/lib/types";
import { IdeaLab } from "./IdeaLab";
import { Studio } from "./Studio";
import { Button, Header, TextWithMic } from "./ui";

const TABS: { part: Part; label: string }[] = [
  { part: "ideas", label: "1 · Idea Generation" },
  { part: "build", label: "2 · Idea Building" },
];

export type Update = (fn: (s: Session) => Session) => void;

/** One project: two tabs the student can move between freely. Both stay mounted so nothing in progress is lost. */
export function Project({ session, update, onHome }: { session: Session; update: Update; onHome: () => void }) {
  const go = (part: Part) => update((s) => ({ ...s, part }));

  /** Opens Part 2 for this idea. A different idea starts the build over, after asking. */
  function startBuild(seed: NonNullable<Session["seed"]>) {
    if (session.seed?.text === seed.text) return go("build");
    if (session.seed && !confirm("Build this idea instead? Your current build and drawing will be replaced.")) return;
    update((s) => ({
      ...newSession(s.topic, s.id),
      conditions: s.conditions, sparks: s.sparks, nextSpark: s.nextSpark, fav: s.fav,
      seed, build: s.build + 1, part: "build", world: s.conditions.picked,
    }));
  }

  /** Saves Part 2's work without touching what Part 1 owns. Late replies from a replaced build are ignored. */
  const saveBuild = (b: Session) =>
    update((s) => (s.id !== b.id || s.build !== b.build ? s : { ...b, part: s.part, conditions: s.conditions, sparks: s.sparks, nextSpark: s.nextSpark, fav: s.fav }));

  return (
    <>
      <Header onHome={onHome} right={<Button variant="ghost" className="!py-1.5 text-sm" onClick={onHome}>My boards</Button>} />
      <nav aria-label="Parts" className="flex h-[57px] items-center justify-center gap-2 border-b border-stone-200 bg-white px-3 print:hidden">
        {TABS.map((t) => (
          <button key={t.part} aria-current={session.part === t.part ? "page" : undefined} onClick={() => go(t.part)}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold sm:text-base ${session.part === t.part ? "border-orange-500 bg-orange-500 text-white" : "border-stone-300 bg-white hover:border-orange-400"}`}>
            {t.label}
          </button>
        ))}
      </nav>
      <div hidden={session.part !== "ideas"}>
        <IdeaLab session={session} active={session.part === "ideas"} update={update} onBuild={startBuild} />
      </div>
      <div hidden={session.part !== "build"}>
        {session.seed ? (
          <Studio key={session.build} session={session} onChange={saveBuild} />
        ) : (
          <NothingToBuild topic={session.topic} onIdeas={() => go("ideas")} onBuild={(text) => startBuild({ text, from: "you" })} />
        )}
      </div>
    </>
  );
}

function NothingToBuild({ topic, onIdeas, onBuild }: { topic: string; onIdeas: () => void; onBuild: (text: string) => void }) {
  const [text, setText] = useState(topic);
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 px-5 py-10 text-center">
      <h1 className="text-3xl font-bold">Choose an idea to build</h1>
      <p className="text-lg text-stone-600">Pick a favorite in Idea Generation, and it will come here.</p>
      <Button onClick={onIdeas}>← Find my idea</Button>
      <p className="mt-4 font-semibold">Already have an idea? Write it here.</p>
      <div className="w-full text-left">
        <TextWithMic value={text} onChange={setText} onSubmit={() => text.trim() && onBuild(text.trim())} placeholder="My idea is…" />
      </div>
      <Button variant="ghost" disabled={!text.trim()} onClick={() => onBuild(text.trim())}>Build my idea →</Button>
    </main>
  );
}
