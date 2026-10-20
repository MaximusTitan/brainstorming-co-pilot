"use client";
import { useState } from "react";
import type { useAuth } from "@/lib/use-auth";
import { Button, Header } from "./ui";

export function AuthScreen({ auth, onHome, onDone }: { auth: ReturnType<typeof useAuth>; onHome: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const err = mode === "in" ? await auth.signIn(email, password) : await auth.signUp(email, password);
    setBusy(false);
    if (err === "check-email") setMsg("Almost there! Check your email and click the link, then sign in.");
    else if (err) setMsg(err);
    else onDone();
  }

  const input = "w-full rounded-xl border-2 border-stone-300 bg-white px-4 py-3 outline-none focus:border-orange-400";
  return (
    <>
      <Header onHome={onHome} />
      <main className="mx-auto w-full max-w-sm flex-1 px-5 py-10">
        <h1 className="text-2xl font-bold mb-1">{mode === "in" ? "Welcome back!" : "Make your account"}</h1>
        <p className="text-sm text-stone-600 mb-5">Sign in to keep your boards safe and open them on any device.</p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className={input} type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required minLength={6} placeholder="Password (6+ characters)" autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button disabled={busy}>{busy ? "…" : mode === "in" ? "Sign in" : "Sign up"}</Button>
          {msg && <p className="text-sm text-red-600" role="alert">{msg}</p>}
        </form>
        <button className="mt-4 text-sm underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>
          {mode === "in" ? "New here? Make an account" : "Already have an account? Sign in"}
        </button>
      </main>
    </>
  );
}
