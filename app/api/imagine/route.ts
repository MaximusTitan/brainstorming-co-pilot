import { generateImage } from "ai";

const IMAGE_MODEL = process.env.IMAGE_MODEL ?? "openai/gpt-image-2";

export async function POST(req: Request) {
  const { title, bigIdea, sketch } = (await req.json()) as { title?: string; bigIdea?: string; sketch?: string };
  if (!title?.trim()) return Response.json({ error: "Missing title" }, { status: 400 });

  const subject = `${title.slice(0, 120)}. ${(bigIdea ?? "").slice(0, 500)}`;
  const base64 = sketch?.startsWith("data:image/png;base64,") ? sketch.slice("data:image/png;base64,".length) : null;

  const text = base64
    ? `Turn this rough child's sketch into a finished, bright, friendly illustration of the real product. The product: ${subject} Keep the same shapes, layout and parts as the sketch, and include anything the child drew in colour. Show it as a clean, believable object on a plain light background. No text, no letters, no people's faces.`
    : `A bright, friendly, colourful children's book illustration of this invention: ${subject} Show the object clearly in the centre on a plain light background. No text, no letters, no people's faces.`;

  try {
    const { image } = await generateImage({
      model: IMAGE_MODEL,
      prompt: base64 ? { text, images: [base64] } : text,
      size: "1024x1024",
    });
    return Response.json({ image: `data:${image.mediaType ?? "image/png"};base64,${image.base64}` });
  } catch (e) {
    return Response.json(
      { error: (e instanceof Error ? e.message : "Image failed").replace(/\u001b\[[0-9;]*m/g, "").trim() },
      { status: 502 },
    );
  }
}
