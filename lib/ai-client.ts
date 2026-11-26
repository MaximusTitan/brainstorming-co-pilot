import type { ArtEl, Block, Extras } from "./types";

type Ctx = {
  topic: string;
  world: string[];
  idea: string;
  block?: { label: string; why?: string };
  choice?: string;
  chosen?: { block: string; choice: string }[];
  remaining?: number;
};

async function post<T>(url: string, payload: object): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data as T;
}
const coach = <T,>(step: string, ctx: Ctx) => post<T>("/api/coach", { step, ...ctx });

export const coachWorld = (topic: string) => post<{ intro: string; conditions: string[] }>("/api/coach", { step: "world", topic, world: [], idea: "" });
export const coachIdeas = (topic: string, world: string[], avoid: string[]) => post<{ intro: string; ideas: string[] }>("/api/coach", { step: "ideas", topic, world, idea: "", avoid });
export const coachBlocks = (c: Ctx) => coach<{ intro: string; blocks: Block[]; pickCount: number }>("blocks", c);
export const coachOptions = (c: Ctx) => coach<{ prompt: string; options: string[] }>("options", c);
export const coachReact = (c: Ctx) => coach<{ reaction: string; deeper: { label: string; why: string } | null }>("react", c);
export const coachExtras = (c: Ctx) => coach<Extras>("extras", c);

/** Rough line art from the model, cleaned so only safe, in-bounds shapes reach the page. */
export async function coachSketch(c: Ctx): Promise<ArtEl[]> {
  const { elements } = await coach<{ elements: Record<string, unknown>[] }>("sketch", c);
  const n = (v: unknown, lo: number, hi: number) => (typeof v === "number" && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : undefined);
  const out: ArtEl[] = [];
  for (const e of elements.slice(0, 32)) {
    const k = e.k as ArtEl["k"];
    const a = e.a === true;
    if (k === "path" && typeof e.d === "string" && e.d.length < 700 && /^[MmLlHhVvCcSsQqTtZz0-9eE.,\s-]+$/.test(e.d)) out.push({ k, d: e.d, a });
    else if (k === "rect") out.push({ k, x: n(e.x, 0, 400), y: n(e.y, 0, 320), w: n(e.w, 1, 400), h: n(e.h, 1, 320), a });
    else if (k === "circle") out.push({ k, x: n(e.x, 0, 400), y: n(e.y, 0, 320), r: n(e.r, 1, 160), a });
    else if (k === "line") out.push({ k, x: n(e.x, 0, 400), y: n(e.y, 0, 320), x2: n(e.x2, 0, 400), y2: n(e.y2, 0, 320), a });
    else if (k === "text" && typeof e.t === "string") out.push({ k, x: n(e.x, 0, 380), y: n(e.y, 12, 316), t: e.t.slice(0, 28) });
  }
  return out;
}

/** Turns the sketch (when given) into a finished picture, then shrinks it so it stays small enough to save with the plan. */
export async function askImage(p: { title: string; bigIdea: string; sketch?: string }): Promise<string> {
  const data = await post<{ image: string }>("/api/imagine", p);
  return shrink(data.image, 640);
}

function shrink(src: string, size: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, size / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
