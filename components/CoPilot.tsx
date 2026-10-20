"use client";
import { useEffect, useRef, useState } from "react";
import { askCopilot, type CopilotReply, type Persona } from "@/lib/ai-client";

const PERSONAS: { id: Persona; icon: string; label: string }[] = [
  { id: "pip", icon: "🦉", label: "Pip" },
  { id: "scientist", icon: "🔬", label: "Scientist" },
  { id: "artist", icon: "🎨", label: "Artist" },
  { id: "customer", icon: "🛒", label: "Customer" },
  { id: "friend", icon: "🧑‍🤝‍🧑", label: "Friend" },
];

const METERS = [
  { key: "clarity", label: "Clear", color: "bg-sky-500" },
  { key: "originality", label: "Original", color: "bg-violet-500" },
  { key: "doability", label: "Doable", color: "bg-green-500" },
] as const;

type Answers = { what: string; why: string; how: string };
type Entry = { who: Persona; text: string; asked?: string };

export function CoPilot({
  topic,
  idea,
  answers,
  onUseSuggestion,
}: {
  topic: string;
  idea: string;
  answers: Answers;
  onUseSuggestion: (field: "what" | "why" | "how", text: string) => void;
}) {
  const [persona, setPersona] = useState<Persona>("pip");
  const [log, setLog] = useState<Entry[]>([]);
  const [reply, setReply] = useState<CopilotReply | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const lastSent = useRef("");
  const seq = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  const answersKey = JSON.stringify(answers);
  const hasText = Object.values(answers).some((a) => a.trim());

  async function ask(who: Persona, q?: string) {
    const id = ++seq.current;
    setBusy(true);
    setError("");
    try {
      const r = await askCopilot({ topic, idea, answers, persona: who, question: q });
      if (id !== seq.current) return;
      setReply(r);
      setLog((l) => [...l.slice(-5), { who, text: r.message, asked: q }]);
    } catch (e) {
      if (id === seq.current) setError(e instanceof Error ? e.message : "Pip got confused, try again!");
    } finally {
      if (id === seq.current) setBusy(false);
    }
  }

  // Pip chimes in on its own when the student pauses typing.
  useEffect(() => {
    if (!hasText || answersKey === lastSent.current) return;
    const t = setTimeout(() => {
      lastSent.current = answersKey;
      ask(persona);
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answersKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [log.length, busy]);

  function pickPersona(p: Persona) {
    setPersona(p);
    if (hasText) ask(p);
  }

  function send(q: string) {
    if (!q.trim() || busy) return;
    setQuestion("");
    lastSent.current = answersKey;
    ask(persona, q.trim());
  }

  const active = PERSONAS.find((p) => p.id === persona)!;

  return (
    <aside className="rounded-3xl border-2 border-orange-300 bg-gradient-to-b from-orange-50 to-yellow-50 p-4 flex flex-col gap-3 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className={`text-5xl ${busy ? "animate-wiggle" : "animate-bob"}`} aria-hidden>{active.icon}</div>
        <div>
          <h2 className="font-bold leading-tight">Your Co-Pilot</h2>
          <p className="text-xs text-stone-600">{busy ? "Thinking…" : "I help you think. You decide!"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Choose a point of view">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={persona === p.id}
            onClick={() => pickPersona(p.id)}
            className={`rounded-full border-2 px-2.5 py-1 text-xs font-semibold transition ${persona === p.id ? "border-orange-500 bg-orange-100" : "border-stone-300 bg-white hover:border-orange-300"}`}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 min-h-24">
        {!log.length && !busy && (
          <p className="rounded-2xl bg-white border border-stone-200 px-3 py-2 text-sm">
            {hasText ? "Give me a second…" : "Start writing your answers and I'll cheer, question and nudge you along. Or pick a point of view above!"}
          </p>
        )}
        {log.map((m, i) => (
          <div key={i} className="animate-pop flex flex-col gap-1">
            {m.asked && <p className="self-end max-w-[90%] rounded-2xl bg-orange-100 border border-orange-300 px-3 py-1.5 text-sm">{m.asked}</p>}
            <p className="rounded-2xl bg-white border border-stone-200 px-3 py-2 text-sm">
              <span aria-hidden>{PERSONAS.find((p) => p.id === m.who)?.icon} </span>{m.text}
            </p>
          </div>
        ))}
        {busy && <p className="text-sm text-stone-500 animate-pulse">{active.icon} thinking…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div ref={endRef} />
      </div>

      {reply && (
        <>
          <div>
            <p className="text-xs font-semibold text-stone-600 mb-1">Try adding…</p>
            <div className="flex flex-col gap-1.5">
              {reply.suggestions.map((s) => (
                <button
                  key={s.field + s.text}
                  onClick={() => onUseSuggestion(s.field, s.text)}
                  className="animate-pop text-left rounded-xl border-2 border-dashed border-orange-300 bg-white px-3 py-1.5 text-sm hover:bg-orange-50"
                >
                  <span className="mr-1 rounded bg-stone-100 px-1 text-[10px] font-bold uppercase">{s.field}</span>
                  ＋ {s.text}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {METERS.map((m) => (
              <div key={m.key} className="flex items-center gap-2 text-xs">
                <span className="w-14">{m.label}</span>
                <div className="h-2.5 flex-1 rounded-full bg-stone-200 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${m.color}`} style={{ width: `${(reply.scores[m.key] / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button disabled={busy || !hasText} onClick={() => send("Why do you say that?")} className="rounded-full border-2 border-stone-300 bg-white px-3 py-1 text-xs font-semibold hover:border-orange-400 disabled:opacity-50">Why?</button>
        <button disabled={busy || !hasText} onClick={() => send("Give me another idea to make this better.")} className="rounded-full border-2 border-stone-300 bg-white px-3 py-1 text-xs font-semibold hover:border-orange-400 disabled:opacity-50">Give me another idea</button>
        <button disabled={busy || !hasText} onClick={() => send("What could go wrong with this idea?")} className="rounded-full border-2 border-stone-300 bg-white px-3 py-1 text-xs font-semibold hover:border-orange-400 disabled:opacity-50">What could go wrong?</button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(question); }} className="flex gap-2">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask me anything…" className="min-w-0 flex-1 rounded-xl border-2 border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400" />
        <button disabled={busy || !question.trim()} className="rounded-xl bg-orange-500 px-3 text-white font-semibold disabled:opacity-50" aria-label="Send">➤</button>
      </form>
    </aside>
  );
}
