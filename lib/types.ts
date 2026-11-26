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

/** Who the words of an idea came from: Pip suggested it, the student typed it, or the student reworded Pip's. */
export type IdeaFrom = "pip" | "you" | "remix";
export type Spark = { id: number; text: string; from: IdeaFrom };
export type Part = "ideas" | "build";

/** One brainstorming session: the ideas from Part 1 plus the chat and canvas of Part 2. Saved as-is to the user's boards. */
export type Session = {
  v: 2;
  id: string;
  topic: string;
  /** the tab the student is on */
  part: Part;
  /* Part 1, idea generation */
  conditions: { intro: string; options: string[]; picked: string[] };
  sparks: Spark[];
  nextSpark: number;
  fav: number | null;
  /* Part 2, idea building. Everything below belongs to the build of `seed`. */
  seed: { text: string; from: IdeaFrom } | null;
  /** goes up each time a build is started over with another idea */
  build: number;
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
  v: 2, id, topic, part: "ideas", conditions: { intro: "", options: [], picked: [] }, sparks: [], nextSpark: 1, fav: null, seed: null, build: 0, world: [], phase: "rules", msgs: [], chips: null, notes: [], nid: 1, idea: null,
  offered: [], queue: [], blk: null, extras: null, deeper: 0, smallest: "", helpers: [],
  art: [], artV: 0, strokes: [], plan: false, planView: false,
});

export const emptySession: Session = newSession();

/** Boards saved by the earlier version have a different shape: keep only the topic and start fresh. */
export function migrate(raw: unknown): Session {
  const r = (raw ?? {}) as Partial<Session> & { topic?: string; id?: string };
  if (r.v === 2) {
    const s = { ...newSession(r.topic ?? "", r.id ?? ""), ...(r as Session) };
    // Boards saved before the two parts existed were already building the typed goal.
    if (!r.part && s.msgs.length) return { ...s, part: "build", seed: { text: s.topic, from: "you" } };
    return s;
  }
  return newSession(r.topic ?? "", r.id ?? "");
}
