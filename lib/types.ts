export type Phase = "rules" | "idea" | "pick" | "shape" | "deeper" | "protect" | "smallest" | "help" | "done";
export type NoteKind = "idea" | "block" | "choice" | "extra";

export type Note = {
  id: number;
  kind: NoteKind;
  text: string;
  /** true when the student typed it; false when they picked one of Pip's options */
  own: boolean;
  parent?: number;
  x: number;
  y: number;
  rot: number;
  c: string;
};

export type Msg = { who: "pip" | "you"; text: string };
export type Chips = {
  items: { label: string; val: string }[];
  multi?: boolean;
  sel?: string[];
  addOwn?: boolean;
};
export type Block = { key: string; label: string; why: string };
export type QueueItem = { key: string; label: string; note: number };
export type Extras = {
  protect: { label: string; note: string }[];
  smallest: string[];
  helpers: string[];
};
export type ArtEl = {
  k: "path" | "rect" | "circle" | "line" | "text";
  d?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  r?: number;
  x2?: number;
  y2?: number;
  t?: string;
  a?: boolean;
};
export type Stroke = { c: string; w: number; t: "pen" | "erase"; pts: [number, number][] };

/** One brainstorming session: a chat with Pip plus the canvas it builds. Saved as-is to the user's boards. */
export type Session = {
  v: 2;
  id: string;
  topic: string;
  world: string[];
  phase: Phase;
  msgs: Msg[];
  chips: Chips | null;
  notes: Note[];
  nid: number;
  idea: number | null;
  offered: Block[];
  queue: QueueItem[];
  blk: QueueItem | null;
  extras: Extras | null;
  deeper: number;
  smallest: string;
  helpers: string[];
  art: ArtEl[];
  artV: number;
  strokes: Stroke[];
  plan: boolean;
  planView: boolean;
  image?: string;
};

export const newSession = (topic = "", id = ""): Session => ({
  v: 2, id, topic, world: [], phase: "rules", msgs: [], chips: null, notes: [], nid: 1, idea: null,
  offered: [], queue: [], blk: null, extras: null, deeper: 0, smallest: "", helpers: [],
  art: [], artV: 0, strokes: [], plan: false, planView: false,
});

export const emptySession: Session = newSession();

/** Boards saved by the earlier version have a different shape: keep only the topic and start fresh. */
export function migrate(raw: unknown): Session {
  const r = (raw ?? {}) as Partial<Session> & { topic?: string; id?: string };
  if (r.v === 2) return { ...newSession(r.topic ?? "", r.id ?? ""), ...(r as Session) };
  return newSession(r.topic ?? "", r.id ?? "");
}
