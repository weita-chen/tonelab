import { CONCEPTS } from "./concepts";
import { CATEGORIES, GENRE_ORDER, type CategoryId, type Concept } from "./types";

const byId = new Map<string, Concept>(CONCEPTS.map((concept) => [concept.id, concept]));

const children = new Map<string, Concept[]>();
for (const concept of CONCEPTS) {
  if (!concept.parentId) continue;
  const list = children.get(concept.parentId) ?? [];
  list.push(concept);
  children.set(concept.parentId, list);
}

function devCheck() {
  const dev = Boolean(
    (import.meta as { env?: { DEV?: boolean } }).env?.DEV,
  );
  if (!dev) return;
  const seen = new Set<string>();
  for (const concept of CONCEPTS) {
    if (seen.has(concept.id)) throw new Error(`重複的概念 id：${concept.id}`);
    seen.add(concept.id);
    if (concept.parentId && !byId.has(concept.parentId)) {
      throw new Error(`${concept.id} 的 parentId 不存在：${concept.parentId}`);
    }
    if (concept.category === "genre" && concept.level > 1 && !concept.parentId) {
      throw new Error(`${concept.id} 是子流派但沒有 parentId`);
    }
    if (concept.level === 3 && !concept.parentId) {
      throw new Error(`${concept.id} 是 level 3 但沒有 parentId`);
    }
    if (!concept.promptTerms[0]) throw new Error(`${concept.id} 缺少 promptTerms`);
  }
  for (const id of GENRE_ORDER) {
    const genre = byId.get(id);
    if (!genre || genre.category !== "genre" || genre.level !== 1) {
      throw new Error(`主流派缺失或層級錯誤：${id}`);
    }
  }
  const roots = CONCEPTS.filter((concept) => concept.category === "genre" && concept.level === 1);
  if (roots.length !== 30) throw new Error(`主流派應為 30，目前 ${roots.length}`);
}

devCheck();

export function getConcept(id: string): Concept | undefined {
  return byId.get(id);
}

export function childrenOf(id: string): Concept[] {
  return children.get(id) ?? [];
}

export function conceptsInCategory(category: CategoryId): Concept[] {
  return CONCEPTS.filter((concept) => concept.category === category);
}

export function topLevel(category: CategoryId): Concept[] {
  return CONCEPTS.filter((concept) => {
    if (concept.category !== category) return false;
    if (!concept.parentId) return true;
    const parent = byId.get(concept.parentId);
    return !parent || parent.category !== category;
  });
}

export function isAncestor(ancestorId: string, concept: Concept): boolean {
  let parentId = concept.parentId;
  const guard = new Set<string>();
  while (parentId) {
    if (parentId === ancestorId) return true;
    if (guard.has(parentId)) return false;
    guard.add(parentId);
    parentId = byId.get(parentId)?.parentId ?? null;
  }
  return false;
}

export function rootGenreId(concept: Concept): string | null {
  if (concept.category !== "genre") return null;
  let current: Concept | undefined = concept;
  while (current?.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent || parent.category !== "genre") break;
    current = parent;
  }
  return current?.id ?? null;
}

export function orderedGenres(): Concept[] {
  return GENRE_ORDER.map((id) => byId.get(id)).filter((concept): concept is Concept => Boolean(concept));
}

export function searchConcepts(query: string): Concept[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CONCEPTS.filter((concept) => blob(concept).includes(q)).sort(
    (a, b) => score(b, q) - score(a, q) || a.name.localeCompare(b.name),
  );
}

function blob(concept: Concept): string {
  return [concept.name, concept.nameZh, concept.descriptionZh, concept.id, ...concept.promptTerms]
    .join("\n")
    .toLowerCase();
}

function score(concept: Concept, q: string): number {
  const name = concept.name.toLowerCase();
  const zh = concept.nameZh.toLowerCase();
  if (name === q || zh === q) return 100;
  if (name.startsWith(q) || zh.startsWith(q)) return 80;
  if (concept.promptTerms.some((term) => term.toLowerCase().includes(q))) return 60;
  if (name.includes(q) || zh.includes(q)) return 40;
  return 10;
}

export function categoryOrder(id: CategoryId): number {
  return CATEGORIES.findIndex((category) => category.id === id);
}

export { CONCEPTS };
