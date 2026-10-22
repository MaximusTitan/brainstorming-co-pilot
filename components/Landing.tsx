"use client";
import Image from "next/image";
import { Button } from "./ui";

const STEPS = [
  { n: 1, title: "Tell Idea Buddy your topic", text: "Type or say anything. Pick a story, science project, invention or event.", img: "/screens/start.png", alt: "Start screen asking what you want to think about" },
  { n: 2, title: "Chat and pin ideas", text: "Get a few ideas at a time. Tap the ones you like to pin them.", img: "/screens/chat.png", alt: "Chat with idea chips to pin" },
  { n: 3, title: "Organise on your board", text: "Star favourites, change colours and drag cards together to group them.", img: "/screens/board.png", alt: "Colourful idea board" },
  { n: 4, title: "Grow it with Pip", text: "Answer what, why and how. Pip the helper gives hints when you're stuck.", img: "/screens/refine.png", alt: "Grow your idea screen with the Pip helper" },
  { n: 5, title: "Get your plan and a picture", text: "Your own words become a plan. Press Imagine to see your idea drawn.", img: "/screens/doc.png", alt: "Idea document with a generated picture" },
];

const FEATURES = [
  { icon: "💡", title: "Idea Generator", text: "A few fresh ideas at a time, so you never feel buried in a long list." },
  { icon: "🗂️", title: "Idea Organiser", text: "Cards you can star, colour and group. Nothing gets lost." },
  { icon: "🌱", title: "Idea Refiner", text: "Turn a rough idea into a plan with steps, strengths and next actions." },
  { icon: "🦉", title: "Pip, your helper", text: "Stuck on a box? Ask Pip for a hint or a starter sentence." },
];

const CHIPS = ["Wristband that buzzes at homework time", "Bag with wheels", "Solar-powered backpack", "Robot helper", "Glowing desk lamp reminder"];

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
                Think of more.<br /><span className="text-[#FF6350]">Choose better.</span>
              </h1>
              <p className="text-lg text-[#E6DCCB]">
                Idea Buddy is a thinking partner for school projects. It asks questions, offers a few ideas at a time and helps you grow the best one into a real plan. The ideas stay yours.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="text-lg" onClick={onSignUp}>Start thinking, it&apos;s free →</Button>
                <button onClick={onSignIn} className="rounded-xl border-2 border-[#E6DCCB] px-5 py-3 font-semibold hover:bg-white/10">I have an account</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2" aria-hidden>
                {CHIPS.map((c, i) => (
                  <span key={c} className="animate-pop rounded-full border-2 border-yellow-400 bg-yellow-100 px-3 py-1 text-sm font-medium text-[#0F2742]" style={{ animationDelay: `${i * 0.12}s` }}>＋ {c}</span>
                ))}
              </div>
            </div>
            <Image src="/screens/board.png" alt="Idea Buddy idea board with colourful cards" width={800} height={500} priority className="w-full rounded-2xl border-4 border-[#FFF8EE] shadow-2xl md:rotate-1" />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="mb-8 text-center text-3xl font-bold">Brainstorming that makes you think</h2>
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
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="mb-10 text-center text-3xl font-bold">From a blank page to a plan in five steps</h2>
            <ol className="flex flex-col gap-12">
              {STEPS.map((s, i) => (
                <li key={s.n} className={`grid items-center gap-6 md:grid-cols-2 ${i % 2 ? "md:[&>div]:order-2" : ""}`}>
                  <Image src={s.img} alt={s.alt} width={800} height={500} className="w-full rounded-2xl border-2 border-[#0F2742] shadow-lg" />
                  <div>
                    <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-orange-500 text-lg font-bold text-white">{s.n}</span>
                    <h3 className="text-2xl font-bold">{s.title}</h3>
                    <p className="mt-2 text-lg text-stone-700">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-[#0F2742] px-5 py-14 text-center text-[#FFF8EE]">
          <h2 className="text-3xl font-bold">Ready for your next big idea?</h2>
          <p className="mt-2 text-[#E6DCCB]">Make a free account to save your boards and open them on any device.</p>
          <Button className="mt-6 text-lg" onClick={onSignUp}>Start thinking →</Button>
        </section>
      </main>

      <footer className="px-5 py-6 text-center text-sm text-stone-500">
        Idea Buddy · Made by students for students · Supports SDG 4 and SDG 9
      </footer>
    </>
  );
}
