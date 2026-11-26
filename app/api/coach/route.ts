import { generateText, Output } from "ai";
import { z } from "zod";

const MODEL = process.env.AI_MODEL ?? "anthropic/claude-haiku-5-5";
const SKETCH_MODEL = process.env.SKETCH_MODEL ?? "anthropic/claude-sonnet-5-5";

const SYSTEM = `You are Pip, a warm co-builder who helps a young inventor (age 10 to 16) take an idea from their head into the real world.
Your stance: "Yes, and". You are never a judge or a quiz master. You encourage, then help them see what it takes to build the idea.
Rules:
- Use short sentences and simple words.
- The student owns the idea. Offer suggestions and options with honest, neutral trade-offs, never a single "right" answer. Never write their answers for them. When asked for starting ideas, offer varied sparks they can pick or change.
- Be specific to THEIR idea and THEIR world (their constraints). Mention a constraint only when it genuinely matters.
- Be respectful and age-appropriate when the topic involves hardship or conflict. Never graphic.
- Plain text only. No markdown, no emojis.`;

const el = z.object({
  k: z.enum(["path", "rect", "circle", "line", "text"]),
  d: z.string().nullish().describe("SVG path data, for path"),
  x: z.number().nullish(),
  y: z.number().nullish(),
  w: z.number().nullish(),
  h: z.number().nullish(),
  r: z.number().nullish(),
  x2: z.number().nullish(),
  y2: z.number().nullish(),
  t: z.string().nullish().describe("label text, for text (max 3 words)"),
  a: z.boolean().nullish().describe("true for an accent detail such as sun rays"),
});

const schemas = {
  world: z.object({
    intro: z.string().describe("One warm sentence reacting to their goal, then inviting them to pick what is true about the world it must work in"),
    conditions: z.array(z.string()).describe("6 conditions or limits likely true for THIS goal, each 2 to 4 words, like 'Small budget' or 'No electricity'. Fit the goal, never generic. Mix resources, people, place and safety where relevant"),
  }),
  ideas: z.object({
    intro: z.string().describe("One warm sentence about their goal, inviting them to pick a favorite or change one"),
    ideas: z.array(z.string()).describe("5 clearly different ideas for the goal, each one plain sentence under 16 words, doable by a student. Mix kinds: an object, a game, an event, a service, something digital"),
  }),
  blocks: z.object({
    intro: z.string().describe("One or two warm sentences reacting to the idea, ending by inviting them to pick parts to shape first"),
    blocks: z
      .array(
        z.object({
          key: z.string().describe("short lowercase slug"),
          label: z.string().describe("1-2 words"),
          why: z.string().describe("under 8 words: what this part decides"),
        }),
      )
      .describe("4 or 5 building blocks this specific idea needs to become real"),
    pickCount: z.number().describe("how many blocks to shape first, 2 to 4"),
  }),
  options: z.object({
    prompt: z.string().describe("One or two sentences introducing this part and how people usually approach it"),
    options: z.array(z.string()).describe("3 realistic ways to do it. Each is a short phrase, a colon, then an honest trade-off, under 18 words in all"),
  }),
  react: z.object({
    reaction: z.string().describe("One short encouraging sentence about their choice, linked to their world if it fits"),
    deeper: z
      .object({ label: z.string().describe("1-2 words"), why: z.string() })
      .nullable()
      .describe("A further part worth shaping ONLY if a big gap remains that the idea cannot work without. Otherwise null"),
  }),
  extras: z.object({
    protect: z
      .array(z.object({ label: z.string().describe("an action, under 8 words"), note: z.string().describe("the same as a short noun phrase for a sticky note") }))
      .describe("3 small things that help the idea last"),
    smallest: z.array(z.string()).describe("3 different smallest versions they could make this week, each under 14 words"),
    helpers: z.array(z.string()).describe("4 kinds of people who could help, 1-4 words each"),
  }),
  sketch: z.object({ elements: z.array(el).describe("rough line art, at most 28 elements") }),
};

type Step = keyof typeof schemas;
type Body = {
  step: Step;
  topic: string;
  world: string[];
  idea: string;
  block?: { label: string; why?: string };
  choice?: string;
  chosen?: { block: string; choice: string }[];
  remaining?: number;
  avoid?: string[];
};

export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  const schema = schemas[b.step];
  if (!schema) return Response.json({ error: "Unknown step" }, { status: 400 });

  // The first two steps happen before there is an idea, so they only need the goal.
  if (b.step === "world" || b.step === "ideas") {
    const prompt = b.step === "world"
      ? `Goal: ${b.topic}\nName the conditions and limits that are probably true for this specific goal.`
      : `Goal: ${b.topic}\nThe world it must work in: ${b.world?.length ? b.world.join("; ") : "not specified"}\nSuggest starting ideas for this goal that work in that world.${b.avoid?.length ? `\nThey already have these, so suggest different ones: ${b.avoid.join(" | ")}` : ""}`;
    try {
      const { output } = await generateText({ model: MODEL, system: SYSTEM, output: Output.object({ schema: schema as never }), prompt });
      return Response.json(output);
    } catch (e) {
      return Response.json({ error: (e instanceof Error ? e.message : "AI request failed").replace(/\u001b\[[0-9;]*m/g, "").trim() }, { status: 502 });
    }
  }

  const ctx = `Goal: ${b.topic}
The world it must work in: ${b.world?.length ? b.world.join("; ") : "not specified"}
The student's idea: ${b.idea}
Choices so far: ${(b.chosen ?? []).map((c) => `${c.block} = ${c.choice}`).join(" | ") || "none yet"}`;

  type BuildStep = Exclude<Step, "world" | "ideas">;
  const prompts: Record<BuildStep, string> = {
    blocks: `${ctx}\nList the building blocks this specific idea needs to become real (for a device: power, brain, body; for a program: users, content, hosting; and so on). Pick what fits THIS idea.`,
    options: `${ctx}\nThe student is now shaping the part "${b.block?.label}" (${b.block?.why ?? ""}). Give 3 realistic ways to do it, with honest trade-offs, fitted to their world.`,
    react: `${ctx}\nThey just chose, for "${b.block?.label}": "${b.choice}". Parts still to shape: ${b.remaining ?? 0}.`,
    extras: `${ctx}\nNow suggest ways to make it last, the smallest version to build this week, and who could help.`,
    sketch: `${ctx}\nDraw a rough hand-made line sketch of the idea as it stands, reflecting the choices so far. Canvas is 400 wide by 320 high. Use simple shapes: path (SVG path data using only M L H V Q C Z), rect (x,y,w,h), circle (x,y,r), line (x,y,x2,y2) and text labels (x,y,t, max 3 words, at most 5 labels). Make it feel hand-drawn: slightly uneven lines, no fills. Center the main object, leave a margin of 20. Mark accents such as sun rays or sparks with a:true. Show only what the choices imply.`,
  };

  try {
    const { output } = await generateText({
      model: b.step === "sketch" ? SKETCH_MODEL : MODEL,
      system: SYSTEM,
      output: Output.object({ schema: schema as never }),
      prompt: prompts[b.step as BuildStep],
    });
    return Response.json(output);
  } catch (e) {
    return Response.json(
      { error: (e instanceof Error ? e.message : "AI request failed").replace(/\u001b\[[0-9;]*m/g, "").trim() },
      { status: 502 },
    );
  }
}
