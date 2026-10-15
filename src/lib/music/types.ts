export type CategoryId =
  | "genre"
  | "mood"
  | "era"
  | "texture"
  | "instrument"
  | "rhythm"
  | "technique"
  | "bpm";

export type Energy = "low" | "mid" | "high";
export type Tempo = "slow" | "mid" | "fast";
export type GenreFamily = "mainstream" | "rock" | "organic" | "global" | "functional";

export type Concept = {
  id: string;
  category: CategoryId;
  name: string;
  nameZh: string;
  descriptionZh: string;
  promptTerms: string[];
  level: 1 | 2 | 3;
  parentId: string | null;
  energy?: Energy;
  tempo?: Tempo;
  redundancyKey?: string;
  affinities?: string[];
  family?: GenreFamily;
  vocal?: boolean;
  beatless?: boolean;
  bpmValue?: number;
  drive?: "club";
};

export const CATEGORIES: { id: CategoryId; en: string; zh: string }[] = [
  { id: "genre", en: "Genre", zh: "流派" },
  { id: "mood", en: "Mood", zh: "情緒" },
  { id: "era", en: "Era", zh: "年代" },
  { id: "texture", en: "Texture", zh: "質感" },
  { id: "instrument", en: "Instruments", zh: "樂器" },
  { id: "rhythm", en: "Rhythm", zh: "律動" },
  { id: "technique", en: "Technique", zh: "技法" },
  { id: "bpm", en: "BPM", zh: "速度" },
];

export const FAMILIES: { id: GenreFamily; zh: string }[] = [
  { id: "mainstream", zh: "主流與節拍" },
  { id: "rock", zh: "搖滾與叛逆" },
  { id: "organic", zh: "有機與原聲" },
  { id: "global", zh: "全球與文化" },
  { id: "functional", zh: "功能與實驗" },
];

export const GENRE_ORDER = [
  "pop",
  "hip-hop",
  "rnb",
  "dance",
  "edm",
  "rock",
  "metal",
  "punk",
  "underground",
  "jazz",
  "classical",
  "country",
  "folk",
  "retro",
  "latin",
  "reggae",
  "african",
  "indian",
  "middle-eastern",
  "east-asian",
  "southeast-asian",
  "ambient",
  "study",
  "workout",
  "gaming",
  "soundtrack",
  "gospel",
  "children",
  "experimental",
  "viral",
] as const;

export function categoryMeta(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
