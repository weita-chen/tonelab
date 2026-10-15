import type { CategoryId, Concept, Energy, GenreFamily, Tempo } from "./types";

export type ConceptOpt = {
  level?: 1 | 2 | 3;
  parentId?: string;
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

export function c(
  id: string,
  category: CategoryId,
  name: string,
  nameZh: string,
  descriptionZh: string,
  prompt: string,
  opt: ConceptOpt = {},
): Concept {
  const level = opt.level ?? (opt.parentId ? 2 : category === "genre" ? 1 : 2);
  return {
    id,
    category,
    name,
    nameZh,
    descriptionZh,
    promptTerms: [prompt],
    level,
    parentId: opt.parentId ?? null,
    energy: opt.energy,
    tempo: opt.tempo,
    redundancyKey: opt.redundancyKey,
    affinities: opt.affinities,
    family: opt.family,
    vocal: opt.vocal,
    beatless: opt.beatless,
    bpmValue: opt.bpmValue,
    drive: opt.drive,
  };
}
