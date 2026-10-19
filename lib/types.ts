export type ProjectType = "Story" | "Science project" | "Invention" | "Event";

export const COLORS = ["yellow", "green", "blue", "purple", "pink", "orange"] as const;
export type CardColor = (typeof COLORS)[number];

export type Idea = {
  id: string;
  text: string;
  starred: boolean;
  color: CardColor;
  group: string | null;
  answers: { what: string; why: string; how: string };
};

export type ChatMsg =
  | { role: "ai"; text: string; chips?: string[] }
  | { role: "user"; text: string };

export type Doc = {
  title: string;
  bigIdea: string;
  steps: string[];
  materials: string[];
  nextActions: string[];
  strengths: string[];
  weaknesses: string[];
};

export type Session = {
  topic: string;
  type: ProjectType;
  messages: ChatMsg[];
  ideas: Idea[];
  activeIdeaId: string | null;
  doc: Doc | null;
};

export const emptySession: Session = {
  topic: "",
  type: "Invention",
  messages: [],
  ideas: [],
  activeIdeaId: null,
  doc: null,
};
