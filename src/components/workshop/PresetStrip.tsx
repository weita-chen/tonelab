import { PRESETS } from "@/lib/presets";
import { useWorkshop } from "@/lib/store";

export function PresetStrip() {
  const load = useWorkshop((state) => state.loadConfiguration);
  return (
    <div className="border-b border-line bg-bg px-3 py-2">
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-xs text-faint">快速起點</p>
        <p className="text-xs text-faint">載入後仍可增刪</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scroll-thin">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() =>
              load({
                selectedIds: preset.selectedIds,
                primaryGenreId: preset.primaryGenreId,
                customPrompt: null,
                favoriteId: null,
              })
            }
            className="min-h-11 w-40 shrink-0 rounded-md border border-line bg-surface px-3 py-2 text-left hover:border-accent"
          >
            <span className="block truncate text-sm font-medium">{preset.nameZh}</span>
            <span className="block truncate text-xs text-faint">{preset.blurbZh}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
