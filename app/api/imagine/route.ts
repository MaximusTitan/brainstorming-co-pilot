import { generateImage } from "ai";

const IMAGE_MODEL = process.env.IMAGE_MODEL ?? "bfl/flux-2-klein-9b";

export async function POST(req: Request) {
  const { title, bigIdea } = (await req.json()) as { title?: string; bigIdea?: string };
  if (!title?.trim()) return Response.json({ error: "Missing title" }, { status: 400 });

  const prompt = `A bright, friendly, colourful children's book illustration of this invention: ${title.slice(0, 120)}. ${(bigIdea ?? "").slice(0, 400)} Show the object clearly in the centre on a plain light background. No text, no letters, no people's faces.`;

  try {
    const { image } = await generateImage({ model: IMAGE_MODEL, prompt, aspectRatio: "1:1" });
    return Response.json({ image: `data:${image.mediaType ?? "image/png"};base64,${image.base64}` });
  } catch (e) {
    return Response.json(
      { error: (e instanceof Error ? e.message : "Image failed").replace(/\u001b\[[0-9;]*m/g, "").trim() },
      { status: 502 },
    );
  }
}
