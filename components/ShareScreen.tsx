"use client";
import { useState } from "react";
import type { Session } from "@/lib/types";
import { Button, Header } from "./ui";
import { DocView } from "./DocScreen";

function toMarkdown(s: Session) {
  const d = s.doc!;
  return `# ${d.title}\n\n## The big idea\n${d.bigIdea}\n\n## Steps\n${d.steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n## Materials\n${d.materials.map((x) => `- ${x}`).join("\n")}\n\n## Strengths\n${d.strengths.map((x) => `- ${x}`).join("\n")}\n\n## Things to watch\n${d.weaknesses.map((x) => `- ${x}`).join("\n")}\n\n## Next actions\n${d.nextActions.map((x) => `- [ ] ${x}`).join("\n")}\n`;
}

export function ShareScreen({ session, onHome, onBack, onNew }: { session: Session; onHome: () => void; onBack: () => void; onNew: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!session.doc) return null;
  const md = toMarkdown(session);
  const mail = `mailto:?subject=${encodeURIComponent(session.doc.title)}&body=${encodeURIComponent(md)}`;

  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = `${session.doc!.title.replace(/\W+/g, "-").toLowerCase()}.md`;
    a.click();
  }

  return (
    <>
      <div className="print:hidden"><Header onHome={onHome} /></div>
      <div className="mx-auto w-full max-w-4xl flex-1 p-4 grid md:grid-cols-[1fr_280px] gap-5">
        <div className="max-h-[75vh] overflow-y-auto print:max-h-none"><DocView doc={session.doc} /></div>
        <aside className="flex flex-col gap-3 print:hidden">
          <h1 className="text-2xl font-bold">Share your plan 🎉</h1>
          <Button variant="ghost" onClick={() => window.print()}>🖨️ Print / save as PDF</Button>
          <Button variant="ghost" onClick={download}>⬇️ Download (.md)</Button>
          <Button variant="ghost" onClick={async () => { await navigator.clipboard.writeText(md); setCopied(true); }}>{copied ? "✅ Copied!" : "📋 Copy text"}</Button>
          <a href={mail} className="rounded-xl bg-orange-500 px-5 py-3 text-center font-semibold text-white hover:bg-orange-600">📧 Send to my teacher</a>
          <Button variant="ghost" onClick={onBack}>← Edit document</Button>
          <Button variant="ghost" onClick={onNew}>Start a new project</Button>
        </aside>
      </div>
    </>
  );
}
