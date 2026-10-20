import type { Doc, ProjectType } from "./types";

async function call<T>(payload: object): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data as T;
}

export const askChat = (p: {
  topic: string;
  type: ProjectType;
  history: { role: string; text: string }[];
  pinned: string[];
}) => call<{ reply: string; ideas: string[] }>({ action: "chat", ...p });

export const askRefine = (p: { topic: string; idea: string }) =>
  call<{ questions: { what: string; why: string; how: string }; hint: string }>({
    action: "refine",
    ...p,
  });

export const askDocument = (p: {
  topic: string;
  idea: string;
  answers: { what: string; why: string; how: string };
}) => call<Doc>({ action: "document", ...p });

export type HelperReply = {
  reply: string;
  suggestion: { field: "what" | "why" | "how"; text: string } | null;
};

export const askHelper = (p: {
  topic: string;
  idea: string;
  answers: { what: string; why: string; how: string };
  history: { role: string; text: string }[];
}) => call<HelperReply>({ action: "helper", ...p });

/** Generates a picture, then shrinks it so it stays small enough to save with the document. */
export async function askImage(p: { title: string; bigIdea: string }): Promise<string> {
  const res = await fetch("/api/imagine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not make the picture");
  return shrink(data.image as string, 640);
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
