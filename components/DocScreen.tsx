"use client";
import { useState } from "react";
import { askImage } from "@/lib/ai-client";
import type { Doc, Session } from "@/lib/types";
import { Button, Header } from "./ui";

function EditableList({ items, onChange, ordered }: { items: string[]; onChange: (v: string[]) => void; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`${ordered ? "list-decimal" : "list-disc"} pl-5 space-y-1`}>
      {items.map((t, i) => (
        <li key={i}>
          <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-yellow-100 rounded"
            onBlur={(e) => onChange(items.map((x, j) => (j === i ? e.currentTarget.textContent ?? x : x)))}>
            {t}
          </span>
        </li>
      ))}
    </Tag>
  );
}

export function DocView({ doc, onChange }: { doc: Doc; onChange?: (d: Doc) => void }) {
  const set = (p: Partial<Doc>) => onChange?.({ ...doc, ...p });
  const h = "text-orange-600 font-bold mt-4 mb-1";
  return (
    <article className="rounded-2xl border-2 border-stone-300 bg-white p-6 print:border-0">
      <h1 contentEditable={!!onChange} suppressContentEditableWarning className="text-3xl font-bold outline-none"
        onBlur={(e) => set({ title: e.currentTarget.textContent ?? doc.title })}>{doc.title}</h1>
      <h2 className={h}>The big idea</h2>
      <p contentEditable={!!onChange} suppressContentEditableWarning className="outline-none"
        onBlur={(e) => set({ bigIdea: e.currentTarget.textContent ?? doc.bigIdea })}>{doc.bigIdea}</p>
      <h2 className={h}>Steps</h2>
      <EditableList ordered items={doc.steps} onChange={(steps) => set({ steps })} />
      <h2 className={h}>Materials</h2>
      <div className="flex flex-wrap gap-2">
        {doc.materials.map((m) => <span key={m} className="rounded-lg border border-yellow-400 bg-yellow-100 px-2 py-1 text-sm">{m}</span>)}
      </div>
      <h2 className={h}>Strengths 💪 and things to watch ⚠️</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <ul className="list-disc pl-5 text-green-800">{doc.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        <ul className="list-disc pl-5 text-red-800">{doc.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
      <h2 className={h}>Next actions</h2>
      <ul className="space-y-1">{doc.nextActions.map((a) => <li key={a}>☐ {a}</li>)}</ul>
    </article>
  );
}

export function DocScreen({
  session,
  update,
  onHome,
  onBack,
  onExport,
}: {
  session: Session;
  update: (p: (s: Session) => Session) => void;
  onHome: () => void;
  onBack: () => void;
  onExport: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!session.doc) return null;
  const doc = session.doc;

  async function imagine() {
    setBusy(true);
    setError("");
    try {
      const image = await askImage({ title: doc.title, bigIdea: doc.bigIdea });
      update((s) => (s.doc ? { ...s, doc: { ...s.doc, image } } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oops, try again!");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header onHome={onHome} />
      <div className="mx-auto w-full max-w-6xl flex-1 p-4 flex flex-col gap-3">
        <p className="text-sm text-stone-600">✏️ Tap any text to change it — it&apos;s your document!</p>
        <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
          <DocView doc={doc} onChange={(d) => update((s) => ({ ...s, doc: d }))} />
          <aside className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-4 flex flex-col gap-3 lg:sticky lg:top-4">
            <h2 className="font-bold">🎨 See your idea</h2>
            <div className="aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-orange-300 bg-white grid place-items-center">
              {doc.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doc.image} alt={`Picture of ${doc.title}`} className="h-full w-full object-cover" />
              ) : (
                <p className="px-4 text-center text-sm text-stone-500">{busy ? "Drawing your idea…" : "Press Imagine to see a picture!"}</p>
              )}
            </div>
            <Button disabled={busy} onClick={imagine}>{busy ? "Drawing…" : doc.image ? "✨ Imagine again" : "✨ Imagine"}</Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </aside>
        </div>
        <div className="flex gap-3 justify-between">
          <Button variant="ghost" onClick={onBack}>← Back to questions</Button>
          <Button onClick={onExport}>Export →</Button>
        </div>
      </div>
    </>
  );
}
