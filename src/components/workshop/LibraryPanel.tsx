import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkshop, type Favorite, type HistoryEntry } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LibraryPanel({
  tab,
  onTab,
  onClose,
}: {
  tab: "history" | "favorites";
  onTab: (tab: "history" | "favorites") => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-bg/70" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tab === "history" ? "歷史紀錄" : "我的範本"}
        className="flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-none"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-3">
          <div className="flex gap-1">
            <TabButton active={tab === "history"} onClick={() => onTab("history")}>
              歷史
            </TabButton>
            <TabButton active={tab === "favorites"} onClick={() => onTab("favorites")}>
              範本
            </TabButton>
          </div>
          <button type="button" className="rounded-md p-2 text-muted hover:text-fg" aria-label="關閉" onClick={onClose}>
            <X className="size-4" />
          </button>
        </header>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {tab === "history" ? <HistoryList onClose={onClose} /> : <FavoriteList onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("min-h-11 rounded-md px-3 text-sm", active ? "bg-accent text-ink" : "text-muted hover:bg-raised")}
    >
      {children}
    </button>
  );
}

function HistoryList({ onClose }: { onClose: () => void }) {
  const history = useWorkshop((state) => state.history);
  const load = useWorkshop((state) => state.loadConfiguration);
  const remove = useWorkshop((state) => state.deleteHistory);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);

  if (!history.length) {
    return <p className="text-sm leading-relaxed text-muted">複製 Prompt 後會留在這裡，最多 30 筆，存在這台裝置上。</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {history.map((entry) => (
        <li key={entry.id} className="rounded-md border border-line bg-bg p-3">
          <p className="numeric text-sm text-muted">{formatTime(entry.timestamp)}</p>
          <p className="font-en mt-1 line-clamp-3 text-sm leading-relaxed tracking-[-0.02em] text-fg">{entry.prompt}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                load(snapshot(entry));
                onClose();
              }}
            >
              載入
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void navigator.clipboard.writeText(entry.prompt).then(() => {
                  setCopiedId(entry.id);
                  window.setTimeout(() => setCopiedId(null), 1200);
                });
              }}
            >
              {copiedId === entry.id ? "已複製" : "複製"}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (armed !== entry.id) {
                  setArmed(entry.id);
                  return;
                }
                remove(entry.id);
              }}
            >
              {armed === entry.id ? "確認刪除" : "刪除"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function FavoriteList({ onClose }: { onClose: () => void }) {
  const favorites = useWorkshop((state) => state.favorites);
  const save = useWorkshop((state) => state.saveFavorite);
  const update = useWorkshop((state) => state.updateFavorite);
  const rename = useWorkshop((state) => state.renameFavorite);
  const remove = useWorkshop((state) => state.deleteFavorite);
  const load = useWorkshop((state) => state.loadConfiguration);
  const activeId = useWorkshop((state) => state.activeFavoriteId);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [armed, setArmed] = useState<string | null>(null);
  const [error, setError] = useState("");

  return (
    <div>
      <form
        className="mb-4 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const id = save(name);
          if (!id) {
            setError("請先取一個名字。");
            return;
          }
          setName("");
          setError("");
        }}
      >
        <label className="text-sm text-muted" htmlFor="favorite-name">
          把目前配置存成範本
        </label>
        <input
          id="favorite-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="例如 Rainy Tokyo Jazz"
          className="font-en min-h-11 rounded-md border border-line bg-bg px-3 text-base tracking-[-0.02em] text-fg outline-none placeholder:text-muted"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" size="sm">
            儲存目前配置
          </Button>
          {activeId && (
            <Button type="button" size="sm" variant="quiet" onClick={() => update(activeId)}>
              更新此範本
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-warn">{error}</p>}
      </form>
      {favorites.length === 0 ? (
        <p className="text-sm leading-relaxed text-muted">還沒有範本。存下來的配置只留在這台裝置。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {favorites.map((favorite) => (
            <li key={favorite.id} className="rounded-md border border-line bg-bg p-3">
              {editing === favorite.id ? (
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    rename(favorite.id, draft);
                    setEditing(null);
                  }}
                >
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="font-en min-h-11 flex-1 rounded-md border border-line bg-surface px-2 text-base tracking-[-0.02em]"
                    aria-label="範本名稱"
                  />
                  <Button type="submit" size="sm" variant="primary">
                    儲存
                  </Button>
                </form>
              ) : (
                <>
                  <p className="font-en text-base font-medium tracking-[-0.02em]">{favorite.name}</p>
                  <p className="text-sm text-muted">
                    <span className="numeric">{formatTime(favorite.updatedAt)}</span>
                    {" · "}
                    <span className="numeric">{favorite.selectedIds.length}</span> 個概念
                  </p>
                </>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    load({ ...snapshot(favorite), favoriteId: favorite.id });
                    onClose();
                  }}
                >
                  載入
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(favorite.id);
                    setDraft(favorite.name);
                  }}
                >
                  重新命名
                </Button>
                <Button size="sm" variant="quiet" onClick={() => update(favorite.id)}>
                  覆寫
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (armed !== favorite.id) {
                      setArmed(favorite.id);
                      return;
                    }
                    remove(favorite.id);
                  }}
                >
                  {armed === favorite.id ? "確認刪除" : "刪除"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function snapshot(entry: HistoryEntry | Favorite) {
  return {
    selectedIds: entry.selectedIds,
    primaryGenreId: entry.primaryGenreId,
    customPrompt: entry.customPrompt,
  };
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}
