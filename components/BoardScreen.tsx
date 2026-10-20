"use client";
import { useState } from "react";
import { COLORS, type Idea, type Session } from "@/lib/types";
import { Button, Header, cardBg } from "./ui";

export function BoardScreen({
  session,
  update,
  onHome,
  onChat,
  onGrow,
}: {
  session: Session;
  update: (p: (s: Session) => Session) => void;
  onHome: () => void;
  onChat: () => void;
  onGrow: (id: string) => void;
}) {
  const [starredOnly, setStarredOnly] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const patch = (id: string, p: Partial<Idea>) =>
    update((s) => ({ ...s, ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...p } : i)) }));
  const remove = (id: string) => update((s) => ({ ...s, ideas: s.ideas.filter((i) => i.id !== id) }));

  function groupOnto(targetId: string) {
    if (!dragId || dragId === targetId) return;
    update((s) => {
      const target = s.ideas.find((i) => i.id === targetId);
      const name = target?.group ?? `Group ${new Set(s.ideas.map((i) => i.group).filter(Boolean)).size + 1}`;
      return {
        ...s,
        ideas: s.ideas.map((i) => (i.id === targetId || i.id === dragId ? { ...i, group: name } : i)),
      };
    });
    setDragId(null);
  }

  const ideas = session.ideas.filter((i) => !starredOnly || i.starred);
  const groups = [...new Set(ideas.map((i) => i.group))].sort((a, b) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b)));

  function rename(oldName: string, next: string) {
    update((s) => ({ ...s, ideas: s.ideas.map((i) => (i.group === oldName ? { ...i, group: next || null } : i)) }));
  }

  return (
    <>
      <Header onHome={onHome} />
      <div className="mx-auto w-full max-w-5xl flex-1 p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold mr-auto">My idea board</h1>
          <Button className="!py-1.5 text-sm" onClick={onChat}>＋ New idea</Button>
          <Button variant="ghost" className={`!py-1.5 text-sm ${starredOnly ? "!border-orange-500" : ""}`} onClick={() => setStarredOnly((v) => !v)}>⭐ Starred only</Button>
        </div>
        <div className="rounded-3xl border-2 border-yellow-300 bg-yellow-50 p-4 flex flex-col gap-5 flex-1">
          {groups.map((g) => (
            <section key={g ?? "none"} className={g ? "rounded-2xl border-2 border-dashed border-orange-300 p-3" : ""}>
              {g && (
                <input
                  defaultValue={g}
                  onBlur={(e) => e.target.value !== g && rename(g, e.target.value.trim())}
                  className="mb-2 bg-transparent font-bold outline-none border-b border-transparent focus:border-orange-400"
                  aria-label="Group name"
                />
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ideas.filter((i) => i.group === g).map((i) => (
                  <div
                    key={i.id}
                    draggable
                    onDragStart={() => setDragId(i.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => groupOnto(i.id)}
                    onClick={() => setSelected(i.id === selected ? null : i.id)}
                    className={`animate-pop rounded-xl border-2 p-3 min-h-28 flex flex-col justify-between cursor-grab shadow-sm ${cardBg[i.color]} ${selected === i.id ? "ring-4 ring-orange-400" : ""}`}
                  >
                    {editing === i.id ? (
                      <textarea
                        autoFocus
                        defaultValue={i.text}
                        className="bg-white/70 rounded p-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => { patch(i.id, { text: e.target.value.trim() || i.text }); setEditing(null); }}
                      />
                    ) : (
                      <p className="font-semibold">{i.text}</p>
                    )}
                    <div className="flex justify-between text-lg" onClick={(e) => e.stopPropagation()}>
                      <button aria-label="Star" onClick={() => patch(i.id, { starred: !i.starred })}>{i.starred ? "⭐" : "☆"}</button>
                      <button aria-label="Edit" onClick={() => setEditing(i.id)}>✏️</button>
                      <button aria-label="Colour" onClick={() => patch(i.id, { color: COLORS[(COLORS.indexOf(i.color) + 1) % COLORS.length] })}>🎨</button>
                      <button aria-label="Delete" onClick={() => remove(i.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
              {g && <button className="mt-2 text-xs underline text-stone-600" onClick={() => rename(g, "")}>Ungroup</button>}
            </section>
          ))}
          {!session.ideas.length && <p className="text-stone-600">No ideas yet. Go back to the chat and pin some!</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-stone-500 mr-auto">Drag one note onto another to group them · tap ⭐ to star · tap a note to select it</p>
          <Button disabled={!selected} onClick={() => selected && onGrow(selected)}>Pick one to grow →</Button>
        </div>
      </div>
    </>
  );
}
