"use client";
import { useEffect, useRef, useState } from "react";
import { askChat } from "@/lib/ai-client";
import { COLORS, type Idea, type Session } from "@/lib/types";
import { Button, Header, TextWithMic } from "./ui";

export function ChatScreen({
  session,
  update,
  onHome,
  onBoard,
}: {
  session: Session;
  update: (p: (s: Session) => Session) => void;
  onHome: () => void;
  onBoard: () => void;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  async function ask(userText?: string) {
    setBusy(true);
    setError("");
    const history = [
      ...session.messages,
      ...(userText ? [{ role: "user" as const, text: userText }] : []),
    ].map((m) => ({ role: m.role, text: m.text }));
    if (userText) update((s) => ({ ...s, messages: [...s.messages, { role: "user", text: userText }] }));
    try {
      const r = await askChat({
        topic: session.topic,
        type: session.type,
        history: history.length ? history : [{ role: "user", text: session.topic }],
        pinned: session.ideas.map((i) => i.text),
      });
      update((s) => ({ ...s, messages: [...s.messages, { role: "ai", text: r.reply, chips: r.ideas }] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oops, try again!");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (started.current || session.messages.length) return;
    started.current = true;
    ask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages.length, busy]);

  function pin(text: string) {
    update((s) => {
      if (s.ideas.some((i) => i.text === text)) return s;
      const idea: Idea = {
        id: crypto.randomUUID(),
        text,
        starred: false,
        color: COLORS[s.ideas.length % COLORS.length],
        group: null,
        answers: { what: "", why: "", how: "" },
      };
      return { ...s, ideas: [...s.ideas, idea] };
    });
  }

  const pinned = new Set(session.ideas.map((i) => i.text));

  function send() {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    pin(t);
    ask(t);
  }

  return (
    <>
      <Header onHome={onHome} right={<Button variant="ghost" className="!py-1.5 text-sm" onClick={onBoard}>My idea board ({session.ideas.length})</Button>} />
      <div className="mx-auto w-full max-w-5xl flex-1 grid md:grid-cols-[1fr_280px] gap-4 p-4">
        <section className="flex flex-col gap-3 min-h-0">
          <p className="font-semibold">{session.type}: <span className="font-normal">{session.topic}</span></p>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-2">
            {session.messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="self-end max-w-[85%] rounded-2xl bg-orange-100 border border-orange-300 px-4 py-2">{m.text}</div>
              ) : (
                <div key={i} className="max-w-[90%] rounded-2xl bg-white border border-stone-300 px-4 py-3">
                  <p>{m.text}</p>
                  {m.chips && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.chips.map((c) => (
                        <button
                          key={c}
                          disabled={pinned.has(c)}
                          onClick={() => pin(c)}
                          className="rounded-full border-2 border-yellow-400 bg-yellow-100 px-3 py-1 text-sm font-medium hover:bg-yellow-200 disabled:opacity-50"
                        >
                          {pinned.has(c) ? "📌" : "＋"} {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            {busy && <p className="text-stone-500 animate-pulse">Idea Pal is thinking…</p>}
            {error && (
              <p className="text-red-600 text-sm">
                {error} <button className="underline" onClick={() => ask()}>Try again</button>
              </p>
            )}
            <div ref={endRef} />
          </div>
          <Button disabled={busy} onClick={() => ask("Give me more ideas, from a different angle!")}>✨ Give me more ideas</Button>
          <TextWithMic value={input} onChange={setInput} onSubmit={send} placeholder="Type your own idea…" />
        </section>
        <aside className="rounded-2xl border-2 border-stone-300 bg-stone-50 p-3 flex flex-col gap-2 h-fit">
          <h2 className="font-bold">📌 Pinned so far</h2>
          {session.ideas.map((i) => (
            <div key={i.id} className="rounded-lg bg-white border border-stone-300 px-3 py-2 text-sm">{i.text}</div>
          ))}
          {!session.ideas.length && <p className="text-xs text-stone-500">Tap an idea chip to pin it to your board.</p>}
          <Button disabled={!session.ideas.length} onClick={onBoard}>Go to board →</Button>
        </aside>
      </div>
    </>
  );
}
