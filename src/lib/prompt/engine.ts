import { getConcept, isAncestor } from "@/lib/music";
import type { Concept } from "@/lib/music/types";
import { CATEGORY_WEIGHTS } from "@/lib/music/weights";

export type PromptSectionId =
  | "primary"
  | "influence"
  | "style"
  | "mood"
  | "era"
  | "texture"
  | "instrument"
  | "rhythm"
  | "technique"
  | "bpm";

export type PromptSection = {
  id: PromptSectionId;
  label: string;
  labelZh: string;
  weight: number;
  concepts: Concept[];
};

export type DroppedConcept = {
  concept: Concept;
  because: Concept;
};

export type PromptAnalysis = {
  sections: PromptSection[];
  prompt: string;
  dropped: DroppedConcept[];
  primary: Concept | null;
  influences: Concept[];
};

const SECTION_META: Record<
  PromptSectionId,
  { label: string; labelZh: string; weight: number; order: number }
> = {
  primary: { label: "Primary Genre", labelZh: "主流派", weight: CATEGORY_WEIGHTS.primaryGenre, order: 0 },
  influence: { label: "Influence", labelZh: "影響", weight: CATEGORY_WEIGHTS.genreInfluence, order: 1 },
  style: { label: "Core Style", labelZh: "風格", weight: CATEGORY_WEIGHTS.coreStyle, order: 2 },
  mood: { label: "Mood", labelZh: "情緒", weight: CATEGORY_WEIGHTS.mood, order: 3 },
  era: { label: "Era", labelZh: "年代", weight: CATEGORY_WEIGHTS.era, order: 4 },
  texture: { label: "Texture", labelZh: "質感", weight: CATEGORY_WEIGHTS.texture, order: 5 },
  instrument: { label: "Instrumentation", labelZh: "樂器", weight: CATEGORY_WEIGHTS.instrument, order: 6 },
  rhythm: { label: "Rhythm", labelZh: "律動", weight: CATEGORY_WEIGHTS.rhythm, order: 7 },
  technique: { label: "Technique", labelZh: "技法", weight: CATEGORY_WEIGHTS.technique, order: 8 },
  bpm: { label: "Tempo", labelZh: "速度 / 力度", weight: CATEGORY_WEIGHTS.bpm, order: 9 },
};

const CATEGORY_SECTION: Record<Concept["category"], PromptSectionId> = {
  genre: "style",
  mood: "mood",
  era: "era",
  texture: "texture",
  instrument: "instrument",
  rhythm: "rhythm",
  technique: "technique",
  bpm: "bpm",
};

export function resolveConcepts(ids: string[]): Concept[] {
  const seen = new Set<string>();
  const concepts: Concept[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const concept = getConcept(id);
    if (!concept) continue;
    seen.add(id);
    concepts.push(concept);
  }
  return concepts;
}

export function analyzeSelection(selectedIds: string[], primaryGenreId: string | null): PromptAnalysis {
  const selected = resolveConcepts(selectedIds);
  const genres = selected.filter((concept) => concept.category === "genre");
  const primary = genres.find((concept) => concept.id === primaryGenreId) ?? genres[0] ?? null;
  const dropped: DroppedConcept[] = [];
  const others = genres.filter((concept) => concept.id !== primary?.id);
  const styles: Concept[] = [];
  const influencePool: Concept[] = [];

  for (const genre of others) {
    if (primary && isAncestor(primary.id, genre)) styles.push(genre);
    else influencePool.push(genre);
  }

  const influences = influencePool.filter((genre) => {
    if (primary && isAncestor(genre.id, primary)) {
      dropped.push({ concept: genre, because: primary });
      return false;
    }
    const narrower = influencePool.find((other) => other.id !== genre.id && isAncestor(genre.id, other));
    if (narrower) {
      dropped.push({ concept: genre, because: narrower });
      return false;
    }
    return true;
  });

  return buildFrom(selected, primary, styles, influences, dropped);
}

function buildFrom(
  selected: Concept[],
  primary: Concept | null,
  styles: Concept[],
  influences: Concept[],
  dropped: DroppedConcept[],
): PromptAnalysis {
  const buckets = new Map<PromptSectionId, Concept[]>();
  const put = (id: PromptSectionId, concept: Concept) => {
    const list = buckets.get(id) ?? [];
    list.push(concept);
    buckets.set(id, list);
  };

  if (primary) put("primary", primary);
  for (const concept of influences) put("influence", concept);
  for (const concept of styles) put("style", concept);

  const voicedGenre = new Set<string>([
    ...(primary ? [primary.id] : []),
    ...influences.map((concept) => concept.id),
    ...styles.map((concept) => concept.id),
    ...dropped.map((item) => item.concept.id),
  ]);

  for (const concept of selected) {
    if (concept.category === "genre") {
      if (!voicedGenre.has(concept.id) && concept.id !== primary?.id) put("style", concept);
      continue;
    }
    put(CATEGORY_SECTION[concept.category], concept);
  }

  const condensed = new Map<PromptSectionId, Concept[]>();
  for (const [id, list] of buckets) {
    if (id === "primary") {
      condensed.set(id, list.slice(0, 1));
      continue;
    }
    const result = representatives(list);
    condensed.set(id, result.kept);
    dropped.push(...result.dropped);
  }

  const sections: PromptSection[] = (Object.keys(SECTION_META) as PromptSectionId[])
    .map((id) => ({
      id,
      label: SECTION_META[id].label,
      labelZh: SECTION_META[id].labelZh,
      weight: SECTION_META[id].weight,
      concepts: condensed.get(id) ?? [],
    }))
    .filter((section) => section.concepts.length > 0)
    .sort((a, b) => b.weight - a.weight || SECTION_META[a.id].order - SECTION_META[b.id].order);

  return {
    sections,
    prompt: renderPrompt(sections),
    dropped,
    primary,
    influences: condensed.get("influence") ?? [],
  };
}

export function buildPrompt(selectedIds: string[], primaryGenreId: string | null): PromptAnalysis {
  return analyzeSelection(selectedIds, primaryGenreId);
}

function representatives(list: Concept[]): { kept: Concept[]; dropped: DroppedConcept[] } {
  const dropped: DroppedConcept[] = [];
  const groups = new Map<string, Concept[]>();
  const unkeyed: Concept[] = [];
  for (const concept of list) {
    if (!concept.redundancyKey) {
      unkeyed.push(concept);
      continue;
    }
    const group = groups.get(concept.redundancyKey) ?? [];
    group.push(concept);
    groups.set(concept.redundancyKey, group);
  }

  const keyed: Concept[] = [];
  for (const group of groups.values()) {
    const ranked = [...group].sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return term(b).length - term(a).length;
    });
    keyed.push(ranked[0]);
    for (const concept of ranked.slice(1)) dropped.push({ concept, because: ranked[0] });
  }

  const pool = [...unkeyed, ...keyed].sort((a, b) => term(b).length - term(a).length);
  const kept: Concept[] = [];
  for (const concept of pool) {
    const existing = kept.find(
      (item) => term(item).toLowerCase() === term(concept).toLowerCase() || includesPhrase(term(item), term(concept)),
    );
    if (existing) {
      dropped.push({ concept, because: existing });
      continue;
    }
    kept.push(concept);
  }
  const keptIds = new Set(kept.map((concept) => concept.id));
  return { kept: list.filter((concept) => keptIds.has(concept.id)), dropped };
}

function term(concept: Concept): string {
  return concept.promptTerms[0] ?? concept.name;
}

function includesPhrase(hay: string, needle: string): boolean {
  const h = hay.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (n.length < 3 || h.length <= n.length) return false;
  let from = 0;
  while (from <= h.length - n.length) {
    const index = h.indexOf(n, from);
    if (index < 0) return false;
    const before = index === 0 ? " " : h[index - 1];
    const after = index + n.length >= h.length ? " " : h[index + n.length];
    if (isBoundary(before) && isBoundary(after)) return true;
    from = index + 1;
  }
  return false;
}

function isBoundary(char: string): boolean {
  return !/[a-z0-9]/i.test(char);
}

function renderPrompt(sections: PromptSection[]): string {
  const chunks: string[] = [];
  let index = 0;
  if (sections[0]?.id === "primary") {
    const primaryTerm = term(sections[0].concepts[0]);
    let next = 1;
    let influenceTerms: string[] = [];
    if (sections[1]?.id === "influence") {
      influenceTerms = sections[1].concepts.map(term);
      next = 2;
    }
    chunks.push(fuseHead(primaryTerm, influenceTerms));
    index = next;
  }
  for (; index < sections.length; index += 1) {
    const section = sections[index];
    if (section.id === "influence") {
      chunks.push(influenceOnly(section.concepts.map(term)));
      continue;
    }
    if (section.id === "primary") {
      chunks.push(term(section.concepts[0]));
      continue;
    }
    chunks.push(...section.concepts.map(term));
  }
  return finish(chunks.filter(Boolean).join(", "));
}

function fuseHead(primaryTerm: string, influenceTerms: string[]): string {
  if (!influenceTerms.length) return primaryTerm;
  return `${primaryTerm} with ${influenceOnly(influenceTerms)}`;
}

function influenceOnly(terms: string[]): string {
  const names = terms.map(asInfluence);
  if (names.length === 1) return `${names[0]} influence`;
  if (names.length === 2) return `${names[0]} and ${names[1]} influences`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} influences`;
}

function asInfluence(value: string): string {
  const first = value.split(/\s+/)[0] ?? value;
  if (/^[A-Z0-9&/+-]{2,}$/.test(first) && !/[a-z]/.test(first)) return value;
  return value.toLowerCase();
}

function finish(body: string): string {
  const compact = body.replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
  if (!compact) return "";
  const cased = compact.charAt(0).toUpperCase() + compact.slice(1);
  return /[.!?]$/.test(cased) ? cased : `${cased}.`;
}
