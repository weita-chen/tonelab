import { X } from "lucide-react";
import type { WorkshopWarning } from "@/lib/prompt/conflicts";
import { useWorkshop } from "@/lib/store";

export function WarningList({ warnings, className }: { warnings: WorkshopWarning[]; className?: string }) {
  const dismissed = useWorkshop((state) => state.dismissedWarningIds);
  const dismiss = useWorkshop((state) => state.dismissWarning);
  const visible = warnings.filter((warning) => !dismissed.includes(warning.id));
  if (!visible.length) return null;
  return (
    <ul className={className ?? "mb-3 flex flex-col gap-2"}>
      {visible.map((warning) => (
        <li key={warning.id} className="flex items-start gap-2 rounded-md border border-warn bg-warn-bg px-3 py-2 text-sm text-fg">
          <p className="flex-1 leading-relaxed">{warning.messageZh}</p>
          <button type="button" className="rounded-md p-2 text-faint hover:text-fg" aria-label="忽略此提醒" onClick={() => dismiss(warning.id)}>
            <X className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
