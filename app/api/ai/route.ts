import { generateText, Output } from "ai";
import { z } from "zod";

const MODEL = process.env.AI_MODEL ?? "anthropic/claude-haiku-5-5";

const SYSTEM = `You are Idea Pal, a friendly thinking partner for school students (ages 10-16).
Use simple, warm language and short sentences. You think WITH the student, not FOR them:
ask questions, offer a few ideas at a time from different perspectives (scientist, artist, customer, friend),
and never write long lists. Keep every idea under 8 words.`;

const schemas = {
  chat: z.object({
    reply: z.string().describe("One or two friendly sentences, ending with a question or nudge"),
    ideas: z.array(z.string()).describe("3 short idea chips, each under 8 words"),
  }),
  refine: z.object({
    questions: z.object({
      what: z.string().describe("A question about what it looks like"),
      why: z.string().describe("A question about why it is needed"),
      how: z.string().describe("A question about how it works"),
    }),
    hint: z.string(),
  }),
  copilot: z.object({
    message: z.string().describe("1-3 short friendly sentences reacting to what the student wrote, in the persona's voice. Ask a question or give a gentle challenge; do not write their answer for them"),
    suggestions: z.array(z.object({
      field: z.enum(["what", "why", "how"]),
      text: z.string().describe("A short thinking starter (under 12 words) the student can add and edit, not a finished answer"),
    })).describe("2 starters"),
    scores: z.object({
      clarity: z.number().min(1).max(5),
      originality: z.number().min(1).max(5),
      doability: z.number().min(1).max(5),
    }),
  }),
  document: z.object({
    title: z.string(),
    bigIdea: z.string().describe("2 sentences"),
    steps: z.array(z.string()).describe("3 to 4 steps"),
    materials: z.array(z.string()).describe("3 to 5 items"),
    nextActions: z.array(z.string()).describe("3 actions"),
    strengths: z.array(z.string()).describe("2 strengths"),
    weaknesses: z.array(z.string()).describe("2 weaknesses"),
  }),
};

export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body as { action: keyof typeof schemas };
  const schema = schemas[action];
  if (!schema) return Response.json({ error: "Unknown action" }, { status: 400 });

  let prompt: string;
  if (action === "chat") {
    prompt = `Project type: ${body.type}. Topic: "${body.topic}".
Conversation so far:\n${(body.history ?? []).map((m: { role: string; text: string }) => `${m.role}: ${m.text}`).join("\n")}
Already pinned ideas: ${(body.pinned ?? []).join("; ") || "none"}.
Reply to the student and offer 3 NEW idea chips from a different perspective than before.`;
  } else if (action === "refine") {
    prompt = `Topic: "${body.topic}". The student picked this idea: "${body.idea}".
Ask one short WHAT, WHY and HOW question to help them grow it, plus a tiny hint if they get stuck.`;
  } else if (action === "copilot") {
    const personas: Record<string, string> = {
      pip: "Pip the wise owl, a kind thinking coach",
      scientist: "a curious scientist who asks about testing, evidence and how things really work",
      artist: "a playful artist who cares about looks, feelings and surprising twists",
      customer: "a real customer who asks if it is useful, easy and worth it",
      friend: "a friendly classmate who cheers them on and spots what is confusing",
    };
    prompt = `You are ${personas[body.persona] ?? personas.pip}, co-piloting a student developing an idea.
Topic: "${body.topic}". Idea: "${body.idea}".
Student's notes so far - What it looks like: ${body.answers?.what || "-"}; Why it is needed: ${body.answers?.why || "-"}; How it works: ${body.answers?.how || "-"}.
${body.question ? `The student asks: "${body.question}"` : "React to their latest thinking and help them go one step deeper."}
Score clarity, originality and doability honestly from 1 to 5 (1 when little is written).`;
  } else {
    prompt = `Topic: "${body.topic}". Idea: "${body.idea}".
Student answers - What: ${body.answers?.what || "-"}; Why: ${body.answers?.why || "-"}; How: ${body.answers?.how || "-"}.
Write a short plan using the student's own words where possible, and be honest about strengths and weaknesses.`;
  }

  try {
    const { output } = await generateText({
      model: MODEL,
      system: SYSTEM,
      output: Output.object({ schema: schema as never }),
      prompt,
    });
    return Response.json(output);
  } catch (e) {
    return Response.json(
      { error: (e instanceof Error ? e.message : "AI request failed").replace(/\u001b\[[0-9;]*m/g, "").trim() },
      { status: 502 },
    );
  }
}
