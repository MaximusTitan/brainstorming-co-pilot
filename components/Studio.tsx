"use client";
/* eslint-disable react-hooks/immutability */
import Image from "next/image";
import { Fragment, useEffect, useReducer, useRef, useState } from "react";
import { composeSketch } from "@/lib/sketch";
import { askImage, coachBlocks, coachWorld, coachExtras, coachOptions, coachReact, coachSketch } from "@/lib/ai-client";
import type { Chips, Note, NoteKind, Phase, Session } from "@/lib/types";
import { Header } from "./ui";
import "./studio.css";

const COLORS = ["n1", "n2", "n3", "n4", "n5"];
const SWATCHES: { v: string; name: string; bg: string }[] = [
  { v: "ink", name: "Ink", bg: "#0f2742" },
  { v: "#ff6350", name: "Coral", bg: "#ff6350" },
  { v: "#3b82f6", name: "Blue", bg: "#3b82f6" },
  { v: "#22a06b", name: "Green", bg: "#22a06b" },
  { v: "#f2b441", name: "Yellow", bg: "#f2b441" },
];
const TAG: Record<NoteKind, string> = { idea: "Your idea", block: "What it takes", choice: "Your choice", extra: "To make it real" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

export function Studio({
  session,
  onChange,
  onHome,
  right,
}: {
  session: Session;
  onChange: (s: Session) => void;
  onHome: () => void;
  right?: React.ReactNode;
}) {
  const [S] = useState<Session>(() => structuredClone(session));
  const [T] = useState({ busy: false, sketching: false, sketchErr: false, imagining: false, imgErr: "", retry: null as null | (() => void), copied: false });
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [view, setView] = useState<"chat" | "canvas" | "sketch">("chat");
  const [tool, setTool] = useState<"pen" | "erase">("pen");
  const [color, setColor] = useState("ink");
  const [skView, setSkView] = useState<"sketch" | "picture">("sketch");
  const [narrow, setNarrow] = useState(false);
  const [input, setInput] = useState("");
  const msgsRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLElement>(null);
  const drawRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ id: number; sx: number; sy: number; moved: boolean; w: number; h: number; l: number; t: number } | null>(null);
  const stroke = useRef<Session["strokes"][number] | null>(null);
  const started = useRef(false);

  const touch = () => { force(); onChange({ ...S }); };
  const note = (id: number) => S.notes.find((n) => n.id === id)!;
  const blocks = () => S.notes.filter((n) => n.kind === "block");
  const choices = (id: number) => S.notes.filter((n) => n.kind === "choice" && n.parent === id);
  const zx = () => (narrow ? 1 : 0.56);

  const ctx = () => ({
    topic: S.topic,
    world: S.world,
    idea: S.idea ? note(S.idea).text : "",
    chosen: blocks().flatMap((b) => choices(b.id).map((c) => ({ block: b.text, choice: c.text }))),
  });

  /* ---------- chat plumbing ---------- */
  async function pip(text: string, chips: Chips | null = null, delay = 450) {
    T.busy = true; force();
    await sleep(delay);
    S.msgs.push({ who: "pip", text }); S.chips = chips; T.busy = false; touch();
  }
  const you = (text: string) => { S.msgs.push({ who: "you", text }); S.chips = null; };

  async function guard(retry: () => Promise<void>, fn: () => Promise<void>) {
    T.busy = true; S.chips = null; force();
    try { await fn(); }
    catch (e) {
      console.error(e);
      T.busy = false; T.retry = () => { void retry(); };
      S.msgs.push({ who: "pip", text: "Oops, I got stuck for a moment. Let’s try that again." });
      S.chips = { items: [{ label: "Try again", val: "__retry" }] };
      touch();
    }
  }

  async function sketch() {
    if (!S.idea) return;
    T.sketching = true; T.sketchErr = false; force();
    try {
      S.art = await coachSketch(ctx()); S.artV++;
    } catch (e) { console.error(e); T.sketchErr = true; }
    T.sketching = false; touch();
  }

  async function ask(phase: Phase, pre = ""): Promise<void> {
    S.phase = phase;
    const again = () => ask(phase, pre);
    if (phase === "rules") return guard(again, async () => {
      const r = await coachWorld(S.topic);
      await pip(`${r.intro} **Which of these are true?** You can add your own.`, { multi: true, sel: [], addOwn: true, items: r.conditions.slice(0, 6).map((w) => ({ label: w, val: w })) }, 0);
    });
    if (phase === "idea") return pip("Thanks, now I can help you properly. **What is your idea?** A rough sentence is perfect.");
    if (phase === "pick") return guard(again, async () => {
      const r = await coachBlocks(ctx());
      S.offered = r.blocks.slice(0, 5);
      const n = Math.max(2, Math.min(4, Math.round(r.pickCount) || 3));
      await pip(`${r.intro} **Pick ${n}** to start with. You can add your own too. I also made a first rough sketch on the right. Draw on it any time.`, { multi: true, sel: [], addOwn: true, items: S.offered.map((b) => ({ label: `${b.label}: ${b.why}`, val: b.key })) }, 0);
    });
    if (phase === "shape") return guard(again, async () => {
      const b = S.blk!;
      const r = await coachOptions({ ...ctx(), block: { label: b.label } });
      await pip(`${pre}Let’s shape **${b.label.toLowerCase()}**. ${r.prompt} Pick one, mix them, or write your own.`, { items: r.options.slice(0, 3).map((o) => ({ label: o, val: o })) }, 0);
    });
    if (phase === "protect") return guard(again, async () => {
      if (!S.extras) S.extras = await coachExtras(ctx());
      await pip(`${pre}You now have the heart of it. A few small things help it last. **Tap any you like.**`, { multi: true, sel: [], items: S.extras.protect.map((p, i) => ({ label: p.label, val: String(i) })) }, 0);
    });
    if (phase === "smallest") return pip("Last big step. **What is the smallest version you could make this week?** Small is how real things start. Pick one or write your own.", { items: (S.extras?.smallest ?? []).map((o) => ({ label: o, val: o })) });
    if (phase === "help") return pip("Nobody builds alone. **Who could help you?**", { multi: true, sel: [], addOwn: true, items: (S.extras?.helpers ?? []).map((o) => ({ label: o, val: o })) });
    if (phase === "done") {
      S.plan = true; S.planView = true;
      await pip("Here is your plan. You came up with the idea and made every choice. I suggested what it takes, and **you decided**. Your sketch stays on the canvas. Keep drawing, then go and make the first one.", null, 300);
      void sketch();
    }
  }

  /* ---------- notes ---------- */
  function addNote(kind: NoteKind, text: string, own: boolean, extra: Partial<Note>): Note {
    const n: Note = { id: S.nid++, kind, text, own, x: 24, y: 56, rot: 0, c: "n1", ...extra };
    S.notes.push(n); return n;
  }
  const addBlock = (label: string, own: boolean) => {
    const k = blocks().length, idea = note(S.idea!), a = ([-30, 28, 75, -75, 120, 150][k % 6] * Math.PI) / 180;
    return addNote("block", label, own, { parent: S.idea!, x: Math.min(90, idea.x + 20 + Math.cos(a) * 26), y: Math.max(38, Math.min(90, idea.y + Math.sin(a) * 32)), rot: 1, c: COLORS[(k + 1) % 5] });
  };
  const addChoice = (b: Note, text: string, own: boolean) => {
    const k = choices(b.id).length;
    return addNote("choice", text, own, { parent: b.id, x: Math.min(92, b.x + 16), y: Math.max(36, Math.min(92, b.y + (k ? 14 : 15))), rot: -1, c: b.c });
  };
  const addExtra = (text: string, own: boolean, c: string) => {
    const k = S.notes.filter((n) => n.kind === "extra").length, idea = note(S.idea!);
    return addNote("extra", text, own, { parent: S.idea!, x: Math.max(12, idea.x - 8 + k * 11), y: Math.min(90, idea.y + 30), rot: 2, c });
  };

  async function nextBlock(pre = ""): Promise<void> {
    if (!S.queue.length) return ask("protect", pre);
    S.blk = S.queue.shift()!; return ask("shape", pre);
  }

  /* ---------- answers ---------- */
  async function submit(val: string, own = true): Promise<void> {
    if (T.busy) return;
    const ph = S.phase, c = S.chips;
    if (ph === "rules" && c) { c.items.push({ label: val, val }); c.sel = [...(c.sel ?? []), val]; return touch(); }
    if (ph === "pick" && c) {
      const n = addBlock(val, true); c.items.push({ label: val, val: `own:${n.id}` }); c.sel = [...(c.sel ?? []), `own:${n.id}`];
      S.msgs.push({ who: "pip", text: `Good one. I added **${val}** to your list.` }); return touch();
    }
    if (ph === "help" && c) { c.items.push({ label: val, val }); c.sel = [...(c.sel ?? []), val]; return touch(); }
    if (ph === "idea") {
      you(val); const n = addNote("idea", val, true, { rot: -2 }); S.idea = n.id; touch();
      void sketch(); return ask("pick");
    }
    if (ph === "shape") {
      you(val); const b = note(S.blk!.note); addChoice(b, val, own); touch();
      void sketch();
      return guard(() => submit(val, own), async () => {
        const r = await coachReact({ ...ctx(), block: { label: b.text }, choice: val, remaining: S.queue.length });
        if (r.deeper && !S.queue.length && S.deeper < 2 && blocks().length < 6) {
          S.deeper++; S.blk = { key: "deeper", label: r.deeper.label, note: -1 };
          await pip(`${r.reaction} Want to shape **${r.deeper.label}** too? ${r.deeper.why}`, { items: [{ label: "Yes, let’s shape it", val: "yes" }, { label: "No, I have enough", val: "no" }] }, 0);
          S.phase = "deeper";
          return;
        }
        await nextBlock(`${r.reaction} `);
      });
    }
    if (ph === "smallest") { S.smallest = val; you(val); addExtra(val, own, "n1"); touch(); return ask("help"); }
  }

  async function chip(val: string, label: string) {
    if (T.busy || !S.chips) return;
    const c = S.chips;
    if (val === "__retry") { const r = T.retry; T.retry = null; S.chips = null; force(); return r?.(); }
    if (c.multi) {
      c.sel = c.sel?.includes(val) ? c.sel.filter((x) => x !== val) : [...(c.sel ?? []), val];
      return touch();
    }
    if (S.phase === "deeper") {
      you(label);
      if (val === "yes") { const b = addBlock(S.blk!.label, false); S.queue.push({ key: "deeper", label: S.blk!.label, note: b.id }); return nextBlock(); }
      return ask("protect");
    }
    if (S.phase === "shape" || S.phase === "smallest") return submit(val, false);
  }

  async function done() {
    if (T.busy || !S.chips) return;
    const c = S.chips, sel = c.sel ?? [], ph = S.phase;
    if (ph === "rules") {
      if (!sel.length) return;
      S.world = c.items.filter((i) => sel.includes(i.val)).map((i) => i.label); you(S.world.join(", "));
      // What they typed on the start screen is the idea: no need to ask for it again.
      S.idea = addNote("idea", S.topic, true, { rot: -2 }).id; touch(); void sketch();
      return ask("pick");
    }
    if (ph === "pick") {
      if (!sel.length) return;
      you(sel.map((k) => (k.startsWith("own:") ? note(+k.slice(4)).text : (S.offered.find((o) => o.key === k)?.label ?? k))).join(", "));
      S.queue = sel.map((k) => {
        if (k.startsWith("own:")) { const o = note(+k.slice(4)); return { key: "own", label: o.text, note: o.id }; }
        const o = S.offered.find((x) => x.key === k)!; const n = addBlock(o.label, false); return { key: o.key, label: o.label, note: n.id };
      });
      touch(); return nextBlock("Great picks. ");
    }
    if (ph === "protect") {
      const picks = sel.map((i) => S.extras!.protect[+i]);
      you(picks.length ? picks.map((p) => p.label).join(", ") : "Skip this");
      picks.forEach((p) => addExtra(p.note, false, "n5")); touch(); return ask("smallest");
    }
    if (ph === "help") { you(sel.length ? sel.join(", ") : "I will find someone"); S.helpers = sel; touch(); return ask("done"); }
  }

  /* ---------- lifecycle ---------- */
  useEffect(() => {
    if (started.current) return; started.current = true;
    if (!S.msgs.length) void ask("rules");
    else if (!S.chips && !["idea", "smallest", "done"].includes(S.phase) && S.phase !== "deeper") void ask(S.phase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const f = () => setNarrow(window.innerWidth <= 860);
    f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f);
  }, []);
  useEffect(() => { const m = msgsRef.current; if (m) m.scrollTop = m.scrollHeight; });

  /* ---------- drawing layer ---------- */
  function redraw() {
    const el = drawRef.current, ctx2 = el?.getContext("2d");
    if (!el || !ctx2) return;
    const r = el.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (r.width && el.width !== Math.round(r.width * dpr)) { el.width = Math.round(r.width * dpr); el.height = Math.round(r.height * dpr); }
    ctx2.clearRect(0, 0, el.width, el.height);
    const k = el.width / (r.width || 1);
    for (const st of S.strokes) {
      ctx2.globalCompositeOperation = st.t === "erase" ? "destination-out" : "source-over";
      ctx2.strokeStyle = ctx2.fillStyle = st.c === "ink" ? "#0f2742" : st.c;
      ctx2.lineWidth = st.w * k; ctx2.lineCap = "round"; ctx2.lineJoin = "round";
      ctx2.beginPath();
      st.pts.forEach((p, i) => (i ? ctx2.lineTo(p[0] * el.width, p[1] * el.height) : ctx2.moveTo(p[0] * el.width, p[1] * el.height)));
      if (st.pts.length === 1) { ctx2.arc(st.pts[0][0] * el.width, st.pts[0][1] * el.height, (st.w * k) / 2, 0, 6.3); ctx2.fill(); } else ctx2.stroke();
    }
    ctx2.globalCompositeOperation = "source-over";
  }
  useEffect(() => { redraw(); });
  const pt = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  /* ---------- note dragging ---------- */
  function noteDown(e: React.PointerEvent<HTMLDivElement>, id: number) {
    const r = canvasRef.current!.getBoundingClientRect();
    drag.current = { id, sx: e.clientX, sy: e.clientY, moved: false, w: r.width, h: r.height, l: r.left, t: r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function noteMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current; if (!d) return;
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 4) d.moved = true;
    if (!d.moved) return;
    const n = note(d.id);
    n.x = Math.max(6, Math.min(94, ((e.clientX - d.l) / d.w) * 100 / zx()));
    n.y = Math.max(8, Math.min(94, ((e.clientY - d.t) / d.h) * 100));
    force();
  }
  function noteUp() { if (drag.current?.moved) touch(); drag.current = null; }

  /* ---------- plan ---------- */
  const markdown = () => {
    const idea = note(S.idea!);
    const takes = blocks().map((b) => `- **${b.text}:** ${choices(b.id).map((c) => c.text).join("; ") || "still to decide"}`).join("\n");
    const extras = S.notes.filter((n) => n.kind === "extra" && n.text !== S.smallest).map((n) => `- ${n.text}`).join("\n");
    return `# ${idea.text}\n\nFor: ${S.topic}\nWorld: ${S.world.join(", ")}\n\n## What it takes\n${takes}\n\n## To make it last\n${extras || "-"}\n\n## Smallest first version\n${S.smallest}\n\n## Who can help\n${S.helpers.join(", ") || "-"}\n`;
  };
  async function imagine() {
    if (T.imagining || S.idea == null) return;
    T.imagining = true; T.imgErr = ""; force();
    try {
      const idea = note(S.idea);
      const sketch = S.art.length || S.strokes.length ? await composeSketch(S.art, S.strokes) : undefined;
      S.image = await askImage({ title: idea.text, bigIdea: `${idea.text}. ${blocks().map((b) => choices(b.id).map((c) => c.text).join(", ")).join(". ")}`, sketch });
      setSkView("picture");
    } catch (e) { console.error(e); T.imgErr = "Pip could not make the picture this time. Try again in a moment."; }
    T.imagining = false; touch();
  }

  /* ---------- render ---------- */
  const typing = ["idea", "shape", "smallest"].includes(S.phase) || !!S.chips?.addOwn;
  const own = S.notes.filter((n) => n.own).length, picked = S.notes.length - own, total = Math.max(1, S.notes.length);

  const plan = () => {
    if (S.idea == null) return null;
    const idea = note(S.idea);
    const extras = S.notes.filter((n) => n.kind === "extra" && n.text !== S.smallest);
    return (
      <div className="plan">
        <div className="acts"><button className="tl" onClick={() => { S.planView = false; touch(); }}>← See my canvas</button></div>
        <div><small>Your idea</small><h2>{idea.text}</h2></div>
        {S.image && <Image src={S.image} alt={`Picture of ${idea.text}`} width={320} height={320} unoptimized />}
        <div><small>What it takes</small><ul>{blocks().map((b) => <li key={b.id}><b>{b.text}:</b> {choices(b.id).map((c) => c.text).join("; ") || "still to decide"}</li>)}</ul></div>
        {extras.length > 0 && <div><small>To make it last</small><ul>{extras.map((n) => <li key={n.id}>{n.text}</li>)}</ul></div>}
        <div className="two"><div><small>Smallest first version</small><p>{S.smallest}</p></div><div><small>Who can help</small><p>{S.helpers.join(", ") || "Find one person this week"}</p></div></div>
        <div>
          <small>Whose thinking is this?</small>
          <div className="meter" role="img" aria-label={`${own} in your own words, ${picked} chosen from Pip's options, 0 written by Pip`}><i className="a" style={{ width: `${(own / total) * 100}%` }} /><i className="c" style={{ width: `${(picked / total) * 100}%` }} /></div>
          <div className="legend"><span>In your words: {own}</span><span>Chosen from Pip’s options: {picked}</span><span>Ideas Pip wrote for you: 0</span></div>
        </div>
        <div className="acts">
          <button className="btn go" onClick={imagine} disabled={T.imagining}>{T.imagining ? "Making your picture…" : S.image ? "✨ Make it again" : "✨ Make the final picture"}</button>
          <button className="btn" onClick={() => window.print()}>Print</button>
          <button className="btn" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([markdown()], { type: "text/markdown" })); a.download = `${idea.text.slice(0, 40).replace(/\W+/g, "-").toLowerCase()}.md`; a.click(); }}>Download</button>
          <button className="btn" onClick={async () => { await navigator.clipboard.writeText(markdown()); T.copied = true; force(); }}>{T.copied ? "Copied" : "Copy"}</button>
          <a className="btn" href={`mailto:?subject=${encodeURIComponent(idea.text)}&body=${encodeURIComponent(markdown())}`}>Send to my teacher</a>
        </div>
        {T.imgErr && <p className="err">{T.imgErr}</p>}
      </div>
    );
  };

  return (
    <>
      <Header onHome={onHome} right={right} />
      <div className="studio" data-view={view}>
        <div className="app" data-view={view}>
          <div className="bar">
            <div className="tabs" role="group" aria-label="View">
              {(["chat", "canvas", "sketch"] as const).map((v) => <button key={v} className="btn" aria-pressed={view === v} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
            </div>
            <div className="sp" />
          </div>
          <div className="split">
            <section className="chat" aria-label="Chat with Pip">
              <div className="msgs" ref={msgsRef} aria-live="polite">
                {S.msgs.map((m, i) => (
                  <div key={i} className={`m ${m.who === "you" ? "you" : ""}`}>
                    {m.who === "pip" && <div className="av" aria-hidden>🦉</div>}
                    <div className="b"><Rich text={m.text} /></div>
                  </div>
                ))}
                {T.busy && <div className="m"><div className="av" aria-hidden>🦉</div><div className="b typing"><i /><i /><i /></div></div>}
              </div>
              <div className="foot">
                <div className="chips">
                  {S.chips && !T.busy && S.chips.items.map((it) => (
                    <button key={it.val} className="chip" aria-pressed={S.chips!.multi ? !!S.chips!.sel?.includes(it.val) : undefined} onClick={() => void chip(it.val, it.label)}>{it.label}</button>
                  ))}
                  {S.chips?.multi && !T.busy && (
                    <>
                      <span className="rowbreak" />
                      <button className="chip done" disabled={!(S.chips.sel?.length) && !["protect", "help"].includes(S.phase)} onClick={() => void done()}>Done →</button>
                    </>
                  )}
                </div>
                <form className="composer" onSubmit={(e) => { e.preventDefault(); const v = input.trim(); if (!v || T.busy) return; setInput(""); void submit(v, true); }} autoComplete="off">
                  <input id="studio-input" type="text" aria-label="Your answer" value={input} onChange={(e) => setInput(e.target.value)} disabled={!typing || T.busy || S.plan} placeholder={S.chips?.addOwn ? "Or add your own" : typing ? "Type your answer, or pick one" : "Pick an option above"} />
                  <button disabled={!typing || T.busy || S.plan || !input.trim()} aria-label="Send">Send</button>
                </form>
              </div>
            </section>

            <section className="canvas" ref={canvasRef} aria-label="Idea canvas">
              <div className="layer">
                {S.plan && S.planView ? plan() : (
                  <>
                    <div className="core"><small>What you want to change</small><h2>{S.topic}</h2>{S.world.length > 0 && <div className="pins">{S.world.map((w) => <span key={w} className="pin">{w}</span>)}</div>}</div>
                    <svg className="links" aria-hidden>
                      {S.notes.filter((n) => n.parent && S.notes.some((p) => p.id === n.parent)).map((n) => { const p = note(n.parent!); return <line key={n.id} x1={`${p.x * zx()}%`} y1={`${p.y}%`} x2={`${n.x * zx()}%`} y2={`${n.y}%`} stroke="var(--muted)" strokeWidth={n.kind === "choice" ? 2 : 3} strokeLinecap="round" opacity={0.7} />; })}
                    </svg>
                    {S.notes.map((n) => (
                      <div key={n.id} className={`note ${n.kind === "idea" ? "main" : "kid"} pop`} style={{ left: `${n.x * zx()}%`, top: `${n.y}%`, ["--r" as string]: `${n.rot}deg`, background: `var(--${n.c})` }} onPointerDown={(e) => noteDown(e, n.id)} onPointerMove={noteMove} onPointerUp={noteUp}>
                        <small>{TAG[n.kind]}{n.own ? "" : " · from Pip"}</small>{n.text}
                      </div>
                    ))}
                    {S.idea && !S.plan && blocks().length > 0 && ["pick", "shape", "protect", "deeper"].includes(S.phase) && (
                      <div className="cov"><b>Your build list</b>{blocks().map((b) => { const y = choices(b.id).length > 0; return <div key={b.id} className={y ? "y" : ""}><i>{y ? "✓" : ""}</i>{b.text}</div>; })}<p>Pip decides when it is enough.</p></div>
                    )}
                    {S.plan && <button className="btn go seeplan" onClick={() => { S.planView = true; touch(); }}>See my plan</button>}
                  </>
                )}
              </div>

              {S.idea != null && (
                <aside className="sketch" aria-label="Sketch of your idea">
                  <div className="sk-head">
                    <div className="sk-title"><b>{skView === "picture" && S.image ? "Final picture" : "Sketch"}</b>
                      {S.image && <div className="sk-tabs" role="group" aria-label="Sketch or picture"><button className="tl" aria-pressed={skView === "sketch"} onClick={() => setSkView("sketch")}>Sketch</button><button className="tl" aria-pressed={skView === "picture"} onClick={() => setSkView("picture")}>Picture</button></div>}
                    </div>
                    <span>{skView === "picture" && S.image ? "Made from your sketch. Go back to the sketch to change it, then make it again." : T.sketching ? "Pip is sketching…" : "Pip draws the rough shape from your choices. Draw on it too."}</span>
                  </div>
                  <div className="sk-stage">
                    {skView === "picture" && S.image && <Image className="sk-img" src={S.image} alt={`Picture of ${note(S.idea).text}`} width={640} height={640} unoptimized />}
                    {T.imagining && <div className="sk-busy" role="status"><b>Pip is turning your sketch into a picture…</b><span>This takes about 30 seconds.</span></div>}
                    <svg className={`sk-art${skView === "picture" && S.image ? " off" : ""}`} viewBox="0 0 400 320" role="img" aria-label="Rough line drawing of your idea">
                      <g key={S.artV} className="dr">
                        {S.art.map((e, i) => {
                          const cls = e.a ? "sun" : undefined;
                          if (e.k === "path") return <path key={i} pathLength={1} d={e.d} className={cls} />;
                          if (e.k === "rect") return <rect key={i} pathLength={1} x={e.x} y={e.y} width={e.w} height={e.h} className={cls} />;
                          if (e.k === "circle") return <circle key={i} pathLength={1} cx={e.x} cy={e.y} r={e.r} className={cls} />;
                          if (e.k === "line") return <line key={i} pathLength={1} x1={e.x} y1={e.y} x2={e.x2} y2={e.y2} className={cls} />;
                          return <text key={i} x={e.x} y={e.y}>{e.t}</text>;
                        })}
                      </g>
                    </svg>
                    <canvas ref={drawRef} className={skView === "picture" && S.image ? "off" : undefined} aria-label="Drawing area"
                      onPointerDown={(e) => { const s = { c: color, w: tool === "erase" ? 22 : 4, t: tool, pts: [pt(e)] }; stroke.current = s; S.strokes.push(s); e.currentTarget.setPointerCapture(e.pointerId); force(); }}
                      onPointerMove={(e) => { if (!stroke.current) return; stroke.current.pts.push(pt(e)); redraw(); }}
                      onPointerUp={() => { if (stroke.current) { stroke.current = null; touch(); } }} />
                  </div>
                  {skView === "picture" && S.image ? (
                    <div className="sk-tools">
                      <button className="btn go" disabled={T.imagining} onClick={() => void imagine()}>{T.imagining ? "Making your picture…" : "✨ Make it again"}</button>
                      <button className="tl" onClick={() => setSkView("sketch")}>Back to my sketch</button>
                      {T.imgErr && <p className="err">{T.imgErr}</p>}
                    </div>
                  ) : (
                    <div className="sk-tools" role="toolbar" aria-label="Drawing tools">
                      <button className="btn go sk-make" disabled={T.imagining || !S.art.length} onClick={() => void imagine()}>{T.imagining ? "Making your picture…" : "✨ Make the final picture"}</button>
                      <div className="sk-break" />

                    <button className="tl" aria-pressed={tool === "pen"} onClick={() => setTool("pen")}>✎ Pen</button>
                    <button className="tl" aria-pressed={tool === "erase"} onClick={() => setTool("erase")}>Eraser</button>
                    {SWATCHES.map((s) => <button key={s.v} className="sw" aria-label={s.name} aria-pressed={color === s.v} style={{ background: s.bg }} onClick={() => { setColor(s.v); setTool("pen"); }} />)}
                    <button className="tl" onClick={() => { S.strokes.pop(); touch(); }}>Undo</button>
                    <button className="tl" onClick={() => { S.strokes = []; touch(); }}>Clear my drawing</button>
                    <button className="tl" disabled={T.sketching} onClick={() => void sketch()}>{T.sketchErr ? "Try Pip’s sketch again" : "Redraw Pip’s sketch"}</button>
                  </div>
                  )}
                </aside>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
