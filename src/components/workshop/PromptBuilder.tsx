import { useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import { getConcept } from "@/lib/music";
import { categoryMeta, type Concept } from "@/lib/music/types";
import { buildPrompt } from "@/lib/prompt/engine";
import { detectConflicts } from "@/lib/prompt/conflicts";
import { useWorkshop } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningList } from "./WarningList";

export function PromptBuilder() {
  const selectedIds = useWorkshop((state) => state.selectedIds);
  const primaryGenreId = useWorkshop((state) => state.primaryGenreId);
  const activeFavoriteId = useWorkshop((state) => state.activeFavoriteId);
  const favorites = useWorkshop((state) => state.favorites);
  const remove = useWorkshop((state) => state.removeConcept);
  const setPrimary = useWorkshop((state) => state.setPrimaryGenre);
  const clearBuilder = useWorkshop((state) => state.clearBuilder);
  const updateFavorite = useWorkshop((state) => state.updateFavorite);
  const [armedClear, setArmedClear] = useState(false);

  const concepts = selectedIds.map((id) => getConcept(id)).filter((item): item is Concept => Boolean(item));
  const analysis = useMemo(() => buildPrompt(selectedIds, primaryGenreId), [selectedIds, primaryGenreId]);
  const warnings = useMemo(() => detectConflicts(selectedIds, primaryGenreId), [selectedIds, primaryGenreId]);
  const dropped = new Map(analysis.dropped.map((item) => [item.concept.id, item.because]));
  const influenceIds = new Set(analysis.influences.map((concept) => concept.id));
  const favorite = favorites.find((item) => item.id === activeFavoriteId);

  const groups = groupConcepts(concepts, analysis.primary?.id ?? null);

  return (
    <section className="flex h-full min-h-0 flex-col bg-bg">
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-3">
        <div>
          <h2 className="text-sm font-semibold">配置台</h2>
          <p className="text-xs text-faint">點選即加入，順序由系統決定</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={!concepts.length}
          onClick={() => {
            if (!armedClear) {
              setArmedClear(true);
              window.setTimeout(() => setArmedClear(false), 2500);
              return;
            }
            clearBuilder();
            setArmedClear(false);
          }}
        >
          {armedClear ? "再按一次清空" : "清空配置"}
        </Button>
      </header>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {favorite && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2">
            <p className="text-sm">
              正在編輯範本 <span className="font-medium">{favorite.name}</span>
            </p>
            <Button size="sm" variant="quiet" onClick={() => updateFavorite(favorite.id)}>
              更新此範本
            </Button>
          </div>
        )}
        <WarningList warnings={warnings} />
        {concepts.length === 0 ? (
          <div className="rounded-md border border-dashed border-line px-4 py-8">
            <p className="text-base font-medium">開始組裝你的聲音。</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              從音色庫點選流派、情緒、質感或樂器，不必照順序。第一個流派會成為主流派，其餘流派視為影響。
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <section key={group.id}>
                <h3 className="mb-2 text-xs tracking-wide text-faint">
                  {group.zh}
                  <span className="ml-2 font-mono normal-case">{group.en}</span>
                </h3>
                <ul className="flex flex-col gap-2">
                  {group.items.map((concept) => {
                    const isPrimary = concept.id === analysis.primary?.id;
                    const isInfluence = influenceIds.has(concept.id);
                    const because = dropped.get(concept.id);
                    return (
                      <li
                        key={concept.id}
                        className={cn(
                          "rounded-md border px-3 py-2",
                          isPrimary ? "border-accent bg-accent text-ink" : "border-line bg-surface",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{concept.name}</span>
                              {isPrimary && (
                                <span className="inline-flex items-center gap-1 text-xs">
                                  <Star className="size-3 fill-current" aria-hidden />
                                  主流派
                                </span>
                              )}
                              {isInfluence && <span className={cn("text-xs", isPrimary ? "text-ink" : "text-accent")}>影響</span>}
                            </div>
                            <p className={cn("text-xs", isPrimary ? "text-ink/80" : "text-muted")}>{concept.nameZh}</p>
                          </div>
                          <button
                            type="button"
                            className={cn("rounded-md p-2", isPrimary ? "hover:bg-ink/10" : "text-faint hover:bg-raised hover:text-fg")}
                            aria-label={`移除 ${concept.name}`}
                            onClick={() => remove(concept.id)}
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        <p className={cn("mt-1 text-sm leading-relaxed", isPrimary ? "text-ink/90" : "text-muted")}>
                          {concept.descriptionZh}
                        </p>
                        {because && (
                          <p className="mt-1 text-xs text-faint">輸出時會併入較具體的 {because.name}，不會重複。</p>
                        )}
                        {!isPrimary && concept.category === "genre" && (
                          <button
                            type="button"
                            className="mt-2 text-xs text-accent underline-offset-2 hover:underline"
                            onClick={() => setPrimary(concept.id)}
                          >
                            設為主流派
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function groupConcepts(concepts: Concept[], primaryId: string | null) {
  const genres = concepts.filter((concept) => concept.category === "genre");
  const orderedGenres = [
    ...genres.filter((concept) => concept.id === primaryId),
    ...genres.filter((concept) => concept.id !== primaryId),
  ];
  const groups: { id: string; zh: string; en: string; items: Concept[] }[] = [];
  if (orderedGenres.length) {
    groups.push({ id: "genre", zh: "流派", en: "Genre", items: orderedGenres });
  }
  for (const category of ["mood", "era", "texture", "instrument", "rhythm", "technique", "bpm"] as const) {
    const items = concepts.filter((concept) => concept.category === category);
    if (!items.length) continue;
    const meta = categoryMeta(category);
    groups.push({ id: category, zh: meta.zh, en: meta.en, items });
  }
  return groups;
}
