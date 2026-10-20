import { generateText, Output } from "ai";
import { z } from "zod";

const MODEL = process.env.AI_MODEL ?? "anthropic/claude-haiku-5-5";

const SYSTEM = `You are Idea Buddy, a friendly thinking partner for school students (ages 10-16).
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
  helper: z.object({
    reply: z.string().describe("1-3 very short, simple sentences for a child; end with one easy question"),
    suggestion: z
      .object({
        field: z.enum(["what", "why", "how"]),
        text: z.string().describe("One short sentence the student could put in that box"),
      })
      .nullable()
      .describe("Only when the student asked for help filling a box; otherwise null"),
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
  } else if (action === "helper") {
    prompt = `You are Pip, a friendly helper chatbot for a school child filling in a form about their idea.
Topic: "${body.topic}". Idea: "${body.idea}".
The form has three boxes. What will it look like: ${body.answers?.what || "(empty)"}. Why do we need it: ${body.answers?.why || "(empty)"}. How will it work: ${body.answers?.how || "(empty)"}.
Chat so far:
${(body.history ?? []).map((m: { role: string; text: string }) => `${m.role}: ${m.text}`).join("\n")}
Reply to the child's last message. Use easy words and very short sentences. Help them fill the boxes or add more detail by asking simple questions and giving small examples. If they ask you to help write a box, offer a suggestion they can edit.`;
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
