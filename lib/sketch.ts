import type { ArtEl, Stroke } from "./types";

const INK = "#0f2742";
const CORAL = "#ff6350";
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Flattens Pip's line art plus the student's own drawing into one PNG, to use as the reference for the final picture. */
export async function composeSketch(art: ArtEl[], strokes: Stroke[], w = 800, h = 640): Promise<string> {
  const parts = art.map((e) => {
    const col = e.a ? CORAL : INK;
    const base = `fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
    if (e.k === "path") return `<path d="${esc(e.d ?? "")}" ${base}/>`;
    if (e.k === "rect") return `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" ${base}/>`;
    if (e.k === "circle") return `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" ${base}/>`;
    if (e.k === "line") return `<line x1="${e.x}" y1="${e.y}" x2="${e.x2}" y2="${e.y2}" ${base}/>`;
    return `<text x="${e.x}" y="${e.y}" font-family="sans-serif" font-size="14" font-weight="700" fill="#5a6b82">${esc(e.t ?? "")}</text>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" width="${w}" height="${h}">${parts.join("")}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const img = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d")!;
  x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);

  // The student's strokes go on their own layer so the eraser only removes their marks.
  const d = document.createElement("canvas"); d.width = w; d.height = h;
  const dx = d.getContext("2d")!;
  for (const st of strokes) {
    dx.globalCompositeOperation = st.t === "erase" ? "destination-out" : "source-over";
    dx.strokeStyle = dx.fillStyle = st.c === "ink" ? INK : st.c;
    dx.lineWidth = st.w * (w / 400); dx.lineCap = "round"; dx.lineJoin = "round";
    dx.beginPath();
    st.pts.forEach((p, i) => (i ? dx.lineTo(p[0] * w, p[1] * h) : dx.moveTo(p[0] * w, p[1] * h)));
    if (st.pts.length === 1) { dx.arc(st.pts[0][0] * w, st.pts[0][1] * h, (st.w * (w / 400)) / 2, 0, 6.3); dx.fill(); } else dx.stroke();
  }
  x.drawImage(d, 0, 0);
  return c.toDataURL("image/png");
}
