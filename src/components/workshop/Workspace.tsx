import { useEffect, useState, type ReactNode } from "react";
import { Bookmark, History } from "lucide-react";
import { useWorkshop } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LibraryPanel } from "./LibraryPanel";
import { MusicPalette } from "./MusicPalette";
import { PresetStrip } from "./PresetStrip";
import { PromptBuilder } from "./PromptBuilder";
import { PromptOutput } from "./PromptOutput";

type Panel = "palette" | "builder" | "output";
type LibraryTab = "history" | "favorites";

export function Workspace() {
  const [panel, setPanel] = useState<Panel>("palette");
  const [library, setLibrary] = useState<LibraryTab | null>(null);
  const selectedCount = useWorkshop((state) => state.selectedIds.length);

  useEffect(() => {
    void useWorkshop.persist.rehydrate();
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <div className="h-1 bg-accent" aria-hidden />
      <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 items-end gap-1" aria-hidden>
            <span className="h-2 w-1 bg-accent" />
            <span className="h-4 w-1 bg-accent" />
            <span className="h-6 w-1 bg-accent" />
          </span>
          <div className="min-w-0">
            <h1 className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-lg">聲音鍛造實驗室</span>
              <span className="brand-en shrink-0 text-sm text-muted">ToneLab</span>
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLibrary("history")} aria-label="開啟歷史">
            <History className="size-4" />
            <span className="hidden sm:inline">歷史</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLibrary("favorites")} aria-label="開啟範本">
            <Bookmark className="size-4" />
            <span className="hidden sm:inline">範本</span>
          </Button>
        </div>
      </header>
      <PresetStrip />
      <div className="grid grid-cols-3 border-b border-line lg:hidden">
        <MobileTab active={panel === "palette"} onClick={() => setPanel("palette")}>
          音色庫
        </MobileTab>
        <MobileTab active={panel === "builder"} onClick={() => setPanel("builder")}>
          配置{selectedCount ? <span className="numeric"> {selectedCount}</span> : null}
        </MobileTab>
        <MobileTab active={panel === "output"} onClick={() => setPanel("output")}>
          輸出
        </MobileTab>
      </div>
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
        <div className={cn("min-h-0 lg:col-span-4 lg:flex", panel === "palette" ? "flex" : "hidden")}>
          <div className="flex h-full min-h-0 w-full flex-col border-line lg:border-r">
            <MusicPalette />
          </div>
        </div>
        <div className={cn("min-h-0 lg:col-span-4 lg:flex", panel === "builder" ? "flex" : "hidden")}>
          <div className="flex h-full min-h-0 w-full flex-col border-line lg:border-r">
            <PromptBuilder />
          </div>
        </div>
        <div className={cn("min-h-0 lg:col-span-4 lg:flex", panel === "output" ? "flex" : "hidden")}>
          <div className="flex h-full min-h-0 w-full flex-col">
            <PromptOutput />
          </div>
        </div>
      </main>
      {library && <LibraryPanel tab={library} onTab={setLibrary} onClose={() => setLibrary(null)} />}
    </div>
  );
}

function MobileTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("min-h-11 text-sm", active ? "bg-raised text-accent" : "text-muted")}
    >
      {children}
    </button>
  );
}
