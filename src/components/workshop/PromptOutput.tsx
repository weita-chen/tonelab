import { useMemo, useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import { buildPrompt } from "@/lib/prompt/engine";
import { detectConflicts } from "@/lib/prompt/conflicts";
import { useWorkshop } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningList } from "./WarningList";

export function PromptOutput() {
  const selectedIds = useWorkshop((state) => state.selectedIds);
  const primaryGenreId = useWorkshop((state) => state.primaryGenreId);
  const customPrompt = useWorkshop((state) => state.customPrompt);
  const setCustomPrompt = useWorkshop((state) => state.setCustomPrompt);
  const pushHistory = useWorkshop((state) => state.pushHistory);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const analysis = useMemo(() => buildPrompt(selectedIds, primaryGenreId), [selectedIds, primaryGenreId]);
  const warnings = useMemo(() => detectConflicts(selectedIds, primaryGenreId), [selectedIds, primaryGenreId]);
  const generated = analysis.prompt;
  const shown = customPrompt ?? generated;
  const dirty = customPrompt !== null;

  async function copy() {
    const text = shown.trim();
    if (!text) return;
    const ok = await writeClipboard(text);
    if (!ok) {
      setCopyError(true);
      return;
    }
    setCopyError(false);
    pushHistory(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface">
      <header className="border-b border-line px-3 py-3">
        <h2 className="text-base">輸出</h2>
        <p className="text-sm text-muted">結構化說明，以及可直接貼上 Suno 的英文</p>
      </header>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <WarningList warnings={warnings} className="mb-3 flex flex-col gap-2 lg:hidden" />
        {analysis.sections.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted">選好概念後，這裡會出現英文 Suno Style Prompt。</p>
        ) : (
          <div className="mb-4 flex flex-col gap-3">
            {analysis.sections.map((section) => (
              <div key={section.id} className="border-b border-line pb-2">
                <div className="text-sm text-muted">
                  <span className="font-medium text-fg">{section.labelZh}</span>
                  <span className="font-en ml-2 tracking-[-0.02em]">{section.label}</span>
                </div>
                <p className={cn("mt-1 text-base text-fg", section.id === "bpm" ? "numeric" : "font-en tracking-[-0.02em]")}>
                  {section.concepts.map((concept) => concept.name).join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="numeric text-sm font-medium tracking-wide text-muted">SUNO STYLE PROMPT</h3>
          {dirty && <span className="text-sm text-accent">已手動修改</span>}
        </div>
        <textarea
          value={shown}
          onChange={(event) => {
            const value = event.target.value;
            setCustomPrompt(value === generated ? null : value);
          }}
          rows={7}
          spellCheck={false}
          aria-label="Suno Style Prompt"
          placeholder="Start building your sound."
          className="font-en w-full resize-y rounded-md border border-line bg-bg p-3 text-base leading-relaxed tracking-[-0.02em] text-fg outline-none placeholder:text-muted"
        />
        {dirty && (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            這段文字已手動改過，不會再自動跟隨配置。配置本身保持不變。
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-muted">
          前段權重最高。預設順序：主流派 → 影響 → 風格 → 情緒 → 年代 → 質感 → 樂器 → 律動 → 技法 → 速度。
        </p>
        <p className="mt-1 text-sm text-muted">
          <span className="numeric">{shown.trim().length}</span> 字元
        </p>
        {copyError && <p className="mt-2 text-sm text-warn">無法寫入剪貼簿，請手動選取文字。</p>}
      </div>
      <footer className="flex gap-2 border-t border-line p-3">
        <Button variant="ghost" size="md" className="shrink-0" disabled={!dirty} onClick={() => setCustomPrompt(null)}>
          <RotateCcw className="size-4" />
          還原生成稿
        </Button>
        <Button variant="primary" size="md" className="flex-1" disabled={!shown.trim()} onClick={() => void copy()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "已複製" : "複製"}
        </Button>
      </footer>
    </section>
  );
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
