"use client";
import { useEffect, useRef, useState } from "react";
import { askHelper, type HelperReply } from "@/lib/ai-client";

type Answers = { what: string; why: string; how: string };
type Msg = { role: "user" | "ai"; text: string; suggestion?: HelperReply["suggestion"] };

const START: Msg = {
  role: "ai",
  text: "Hi! I'm Pip 🦉 I can help you fill in the boxes. What do you want help with?",
};

const QUICK = ["Help me fill in a box", "Give me more details", "I'm stuck"];

export function ChatHelper({
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
  const [msgs, setMsgs] = useState<Msg[]>([START]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [used, setUsed] = useState<Set<number>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs.length, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const next: Msg[] = [...msgs, { role: "user", text: t }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const r = await askHelper({
        topic,
        idea,
        answers,
        history: next.map((m) => ({ role: m.role, text: m.text })),
      });
      setMsgs([...next, { role: "ai", text: r.reply, suggestion: r.suggestion }]);
    } catch {
      setError("Oops, I got confused. Try again!");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-3 flex flex-col gap-3 md:sticky md:top-4 md:h-[calc(100vh-2rem)] max-h-[32rem] md:max-h-none">
      <h2 className="font-bold">🦉 Pip, your helper</h2>
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`animate-pop flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
            <p className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-orange-200" : "bg-white border border-stone-200"}`}>{m.text}</p>
            {m.suggestion && (
              <button
                disabled={used.has(i)}
                onClick={() => {
                  onUseSuggestion(m.suggestion!.field, m.suggestion!.text);
                  setUsed(new Set(used).add(i));
                }}
                className="max-w-[92%] text-left rounded-xl border-2 border-dashed border-orange-400 bg-white px-3 py-1.5 text-sm hover:bg-orange-100 disabled:opacity-60"
              >
                {used.has(i) ? "✅ Added to" : "＋ Add to"} <b>{m.suggestion.field.toUpperCase()}</b>: {m.suggestion.text}
              </button>
            )}
          </div>
        ))}
        {busy && <p className="text-sm text-stone-500 animate-pulse">Pip is typing…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div ref={endRef} />
      </div>
      {msgs.length === 1 && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)} className="rounded-full border-2 border-orange-300 bg-white px-3 py-1 text-xs font-semibold hover:bg-orange-100">{q}</button>
          ))}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Pip…" className="min-w-0 flex-1 rounded-xl border-2 border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400" />
        <button disabled={busy || !input.trim()} aria-label="Send" className="rounded-xl bg-orange-500 px-3 font-semibold text-white disabled:opacity-50">➤</button>
      </form>
    </aside>
  );
}
