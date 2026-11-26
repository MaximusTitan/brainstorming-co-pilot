"use client";
import Image from "next/image";
import { Button } from "./ui";

const STEPS = [
  { n: 1, title: "Tell Pip what you want to change", text: "Type or say it. Then describe the world your idea has to work in." },
  { n: 2, title: "Find your idea", text: "Pip suggests ideas to spark yours. Pick a favorite, remix one, or add your own." },
  { n: 3, title: "See what it takes", text: "Pip suggests the building blocks. You pick the ones to shape and choose between real options, with honest trade-offs." },
  { n: 4, title: "Watch a sketch appear", text: "Pip draws rough line art of your idea as you decide. You can draw on it too." },
  { n: 5, title: "Leave with a plan", text: "The smallest version to make this week, who can help, and everything you chose, ready to print or send to your teacher." },
];

const FEATURES = [
  { icon: "💬", title: "A coach, not a judge", text: "Pip says yes first, then helps you work out what it takes." },
  { icon: "🧩", title: "Real options", text: "Three ways to do each part, with the trade-offs in plain words. You decide." },
  { icon: "✏️", title: "Sketch it together", text: "Rough line art that grows with your choices. Draw over it with your own pen." },
  { icon: "🌍", title: "Built for your world", text: "No electricity? Very low cost? Pip keeps your real-life limits in mind." },
];

const CHIPS = ["Solar learning device", "Cards that teach", "Bag that remembers homework", "Water saver for school", "Songs that teach counting"];

function Mock() {
  return (
    <div className="grid grid-cols-[1fr_1.1fr] gap-3 rounded-2xl border-4 border-[#FFF8EE] bg-white p-3 text-[#0F2742] shadow-2xl md:rotate-1" aria-hidden>
      <div className="flex flex-col gap-2 text-sm">
        <p className="w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2">I love it. To build it, here is what it takes. <b>Which parts first?</b></p>
        <div className="flex flex-wrap gap-1.5">{["Power", "Brain", "Body"].map((c) => <span key={c} className="rounded-full border-2 border-orange-400 bg-orange-400 px-2.5 py-0.5 text-xs font-bold">{c}</span>)}</div>
        <p className="ml-auto w-[80%] rounded-2xl rounded-tr-sm bg-amber-100 px-3 py-2">A palm-sized solar panel</p>
        <p className="w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2">Good choice. Now the brain…</p>
      </div>
      <div className="relative min-h-[220px] rounded-xl bg-[#e9eff8]">
        <div className="absolute left-2 top-2 w-[46%] rotate-[-2deg] rounded bg-yellow-300 p-2 text-xs font-bold shadow">Handheld learning device<br />with solar and AI</div>
        <div className="absolute left-3 top-[48%] rotate-1 rounded bg-sky-200 p-1.5 text-[11px] font-bold shadow">Power: palm panel</div>
        <div className="absolute left-3 top-[70%] -rotate-1 rounded bg-green-200 p-1.5 text-[11px] font-bold shadow">Brain: offline AI</div>
        <svg viewBox="0 0 120 100" className="absolute bottom-2 right-2 h-[62%] w-[48%] rounded-lg border-2 border-[#0F2742] bg-white p-1" fill="none" stroke="#0F2742" strokeWidth="2.5" strokeLinecap="round">
          <path d="M34 28 L86 27 L87 88 L33 89 Z" /><path d="M40 38 L80 38 L80 62 L40 62 Z" /><path d="M42 12 L78 11 L82 22 L38 23 Z" /><circle cx="100" cy="14" r="5" stroke="#FF6350" />
        </svg>
      </div>
    </div>
  );
}

export function Landing({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  return (
    <>
      <header className="flex items-center justify-between px-5 py-3 border-b border-stone-200 bg-white">
        <Image src="/logo.png" alt="Idea Buddy" width={1248} height={314} className="h-9 w-auto" priority />
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="!py-1.5 text-sm" onClick={onSignIn}>Sign in</Button>
          <Button className="!py-1.5 text-sm" onClick={onSignUp}>Get started</Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-[#0F2742] text-[#FFF8EE]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
            <div className="flex flex-col gap-5">
              <p className="w-fit rounded-full bg-[#FFD36B] px-3 py-1 text-sm font-bold text-[#0F2742]">Free for every student</p>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Turn your idea<br /><span className="text-[#FF6350]">into something real.</span>
              </h1>
              <p className="text-lg text-[#E6DCCB]">
                Idea Buddy is a coach for young inventors. Tell Pip your idea and it helps you work out what it takes to build it: the parts, the options, the smallest first version and who can help. The idea stays yours.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="text-lg" onClick={onSignUp}>Start building, it&apos;s free →</Button>
                <button onClick={onSignIn} className="rounded-xl border-2 border-[#E6DCCB] px-5 py-3 font-semibold hover:bg-white/10">I have an account</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2" aria-hidden>
                {CHIPS.map((c, i) => (
                  <span key={c} className="animate-pop rounded-full border-2 border-yellow-400 bg-yellow-100 px-3 py-1 text-sm font-medium text-[#0F2742]" style={{ animationDelay: `${i * 0.12}s` }}>＋ {c}</span>
                ))}
              </div>
            </div>
            <Mock />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="mb-8 text-center text-3xl font-bold">A coach that helps you build, not a chatbot that does it for you</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border-2 border-stone-200 bg-white p-5">
                <div className="mb-2 text-4xl" aria-hidden>{f.icon}</div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-stone-600">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-orange-50 py-14">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="mb-8 text-center text-3xl font-bold">From a rough idea to a plan in five steps</h2>
            <ol className="flex flex-col gap-5">
              {STEPS.map((s) => (
                <li key={s.n} className="flex items-start gap-4 rounded-2xl border-2 border-stone-200 bg-white p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-500 text-lg font-bold text-white">{s.n}</span>
                  <div>
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <p className="mt-1 text-stone-700">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-[#0F2742] px-5 py-14 text-center text-[#FFF8EE]">
          <h2 className="text-3xl font-bold">Ready to build your idea?</h2>
          <p className="mt-2 text-[#E6DCCB]">Make a free account to save your boards and open them on any device.</p>
          <Button className="mt-6 text-lg" onClick={onSignUp}>Start building →</Button>
        </section>
      </main>

      <footer className="px-5 py-6 text-center text-sm text-stone-500">
        Idea Buddy · Made by students for students · Supports SDG 4 and SDG 9
      </footer>
    </>
  );
}
