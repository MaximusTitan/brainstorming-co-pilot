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
