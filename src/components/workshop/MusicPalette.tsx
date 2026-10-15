import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { childrenOf, orderedGenres, rootGenreId, searchConcepts, topLevel } from "@/lib/music";
import { CATEGORIES, FAMILIES, categoryMeta, type CategoryId, type Concept, type GenreFamily } from "@/lib/music/types";
import { useWorkshop } from "@/lib/store";
import { getConcept } from "@/lib/music";
import { cn, latinFace } from "@/lib/utils";

export function MusicPalette() {
  const [category, setCategory] = useState<CategoryId>("genre");
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<GenreFamily | "all">("all");
  const selectedIds = useWorkshop((state) => state.selectedIds);
  const primaryGenreId = useWorkshop((state) => state.primaryGenreId);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const primary = primaryGenreId ? getConcept(primaryGenreId) : undefined;
  const primaryRoot = primary ? rootGenreId(primary) : null;
  const results = query.trim() ? searchConcepts(query) : [];

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface">
      <header className="border-b border-line px-3 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base">音色庫</h2>
          <span className="text-sm text-muted">
            已選 <span className="numeric">{selectedIds.length}</span>
          </span>
        </div>
        <label className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-line bg-bg px-2">
          <Search className="size-4 shrink-0 text-faint" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋 Jazz、薩克斯、溫暖…"
            className="w-full bg-transparent text-base text-fg outline-none placeholder:text-muted"
          />
          {query && (
            <button type="button" className="text-faint hover:text-fg" onClick={() => setQuery("")} aria-label="清除搜尋">
              <X className="size-4" />
            </button>
          )}
        </label>
      </header>

      {query.trim() ? (
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <p className="mb-2 text-sm text-muted">
            搜尋全庫 · <span className="numeric">{results.length}</span> 筆
          </p>
          {results.length === 0 ? (
            <p className="text-sm text-muted">沒有符合「{query.trim()}」的概念。</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {results.map((concept) => (
                <li key={concept.id}>
                  <ConceptButton concept={concept} selected={selected.has(concept.id)} affinity={isAffinity(concept, primaryRoot)} showCategory />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 scroll-thin">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={cn(
                  "min-h-11 shrink-0 rounded-md px-3 text-sm",
                  category === item.id ? "bg-accent text-ink" : "text-muted hover:bg-raised hover:text-fg",
                )}
              >
                {item.zh}
              </button>
            ))}
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {category === "genre" ? (
              <GenreBrowser family={family} onFamily={setFamily} selected={selected} primaryRoot={primaryRoot} />
            ) : (
              <ul className="flex flex-col gap-2">
                {topLevel(category).map((concept) => (
                  <li key={concept.id}>
                    <ConceptNode concept={concept} selected={selected} primaryRoot={primaryRoot} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function GenreBrowser({
  family,
  onFamily,
  selected,
  primaryRoot,
}: {
  family: GenreFamily | "all";
  onFamily: (family: GenreFamily | "all") => void;
  selected: Set<string>;
  primaryRoot: string | null;
}) {
  const genres = orderedGenres().filter((genre) => family === "all" || genre.family === family);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1">
        <FilterChip active={family === "all"} onClick={() => onFamily("all")}>
          全部
        </FilterChip>
        {FAMILIES.map((item) => (
          <FilterChip key={item.id} active={family === item.id} onClick={() => onFamily(item.id)}>
            {item.zh}
          </FilterChip>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {genres.map((genre) => (
          <li key={genre.id}>
            <ConceptNode concept={genre} selected={selected} primaryRoot={primaryRoot} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-md px-3 text-sm",
        active ? "bg-raised text-fg ring-1 ring-accent" : "text-muted hover:bg-raised",
      )}
    >
      {children}
    </button>
  );
}

function ConceptNode({
  concept,
  selected,
  primaryRoot,
  depth = 0,
}: {
  concept: Concept;
  selected: Set<string>;
  primaryRoot: string | null;
  depth?: number;
}) {
  const kids = childrenOf(concept.id);
  const [open, setOpen] = useState(false);
  return (
    <div className={depth > 0 ? "mt-2 border-l border-line pl-2" : undefined}>
      <div className="flex items-stretch gap-1">
        <ConceptButton concept={concept} selected={selected.has(concept.id)} affinity={isAffinity(concept, primaryRoot)} />
        {kids.length > 0 && (
          <button
            type="button"
            className="flex w-11 shrink-0 items-center justify-center rounded-md border border-line text-muted hover:text-fg"
            aria-expanded={open}
            aria-label={open ? `收合 ${concept.nameZh}` : `展開 ${concept.nameZh}`}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        )}
      </div>
      {concept.level === 1 && !open && kids.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {kids.map((kid) => (
            <MiniChip key={kid.id} concept={kid} selected={selected.has(kid.id)} />
          ))}
        </div>
      )}
      {open &&
        kids.map((kid) => (
          <ConceptNode key={kid.id} concept={kid} selected={selected} primaryRoot={primaryRoot} depth={depth + 1} />
        ))}
    </div>
  );
}

function MiniChip({ concept, selected }: { concept: Concept; selected: boolean }) {
  const toggle = useWorkshop((state) => state.toggleConcept);
  return (
    <button
      type="button"
      onClick={() => toggle(concept.id)}
      title={concept.descriptionZh}
      aria-pressed={selected}
      className={cn(
        "min-h-11 min-w-24 rounded-md border px-2 py-1 text-left",
        selected ? "border-accent bg-raised" : "border-line bg-bg hover:border-muted",
      )}
    >
      <span className={cn("block text-sm font-medium text-fg", latinFace(concept))}>{concept.name}</span>
      <span className="block text-sm text-muted">{concept.nameZh}</span>
    </button>
  );
}

function ConceptButton({
  concept,
  selected,
  affinity,
  showCategory = false,
}: {
  concept: Concept;
  selected: boolean;
  affinity: boolean;
  showCategory?: boolean;
}) {
  const toggle = useWorkshop((state) => state.toggleConcept);
  const parent = concept.parentId ? getConcept(concept.parentId) : undefined;
  return (
    <button
      type="button"
      onClick={() => toggle(concept.id)}
      aria-pressed={selected}
      className={cn(
        "min-h-11 w-full rounded-md border px-3 py-2 text-left transition-colors duration-150",
        selected ? "border-accent bg-raised" : "border-line bg-bg hover:border-muted",
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span>
          <span className={cn("block text-base font-medium text-fg", latinFace(concept))}>{concept.name}</span>
          <span className="block text-sm text-muted">{concept.nameZh}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {showCategory && <span className="text-sm text-muted">{categoryMeta(concept.category).zh}</span>}
          {affinity && <span className="text-sm text-accent">契合</span>}
          {selected && <span className="text-sm text-accent">已加入</span>}
        </span>
      </span>
      <span className="mt-1 block text-sm leading-relaxed text-muted">{concept.descriptionZh}</span>
      {parent && showCategory && <span className="mt-1 block text-sm text-muted">屬於 {parent.nameZh}</span>}
    </button>
  );
}

function isAffinity(concept: Concept, primaryRoot: string | null): boolean {
  if (!primaryRoot || concept.category === "genre") return false;
  return concept.affinities?.includes(primaryRoot) ?? false;
}
