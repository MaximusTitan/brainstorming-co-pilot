"use client";
import { useRef, useState } from "react";
import type { CardColor } from "@/lib/types";

export const cardBg: Record<CardColor, string> = {
  yellow: "bg-yellow-200 border-yellow-400",
  green: "bg-green-200 border-green-400",
  blue: "bg-sky-200 border-sky-400",
  purple: "bg-violet-200 border-violet-400",
  pink: "bg-pink-200 border-pink-400",
  orange: "bg-orange-200 border-orange-400",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const base =
    "rounded-xl px-5 py-3 font-semibold transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const v =
    variant === "primary"
      ? "bg-orange-500 text-white hover:bg-orange-600 shadow"
      : "bg-white border-2 border-stone-300 hover:border-orange-400";
  return <button className={`${base} ${v} ${className}`} {...props} />;
}

export function Header({ onHome, right }: { onHome: () => void; right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-stone-200 bg-white">
      <button onClick={onHome} className="text-xl font-bold text-orange-600">
        💡 Idea Pal
      </button>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

export function TextWithMic({
  value,
  onChange,
  onSubmit,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  function toggleMic() {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      alert("Voice typing isn't supported in this browser. Try Chrome!");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e) => onChange((value ? value + " " : "") + e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  const common =
    "flex-1 bg-transparent outline-none text-lg placeholder:text-stone-400 resize-none";
  return (
    <div className="flex items-center gap-2 rounded-2xl border-2 border-orange-400 bg-white px-4 py-3">
      {multiline ? (
        <textarea
          rows={2}
          className={common}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={common}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
        />
      )}
      <button
        type="button"
        aria-label="Talk instead of typing"
        onClick={toggleMic}
        className={`h-10 w-10 rounded-full border-2 ${listening ? "bg-red-100 border-red-400 animate-pulse" : "border-stone-300"}`}
      >
        🎤
      </button>
    </div>
  );
}
