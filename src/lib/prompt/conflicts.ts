import { buildPrompt, resolveConcepts, type DroppedConcept } from "@/lib/prompt/engine";
import type { Concept } from "@/lib/music/types";

export type WorkshopWarning = {
  id: string;
  messageZh: string;
};

const OVERLOAD_CONCEPTS = 12;
const OVERLOAD_GENRES = 4;

export function detectConflicts(selectedIds: string[], primaryGenreId: string | null): WorkshopWarning[] {
  const selected = resolveConcepts(selectedIds);
  if (!selected.length) return [];
  const analysis = buildPrompt(selectedIds, primaryGenreId);
  const warnings: WorkshopWarning[] = [];

  const slow = selected.filter((concept) => concept.tempo === "slow" || concept.beatless);
  const fast = selected.filter((concept) => concept.tempo === "fast");
  const club = selected.filter((concept) => concept.drive === "club");
  const numbered = selected.filter((concept) => typeof concept.bpmValue === "number");

  let tempoCovered = false;
  for (let i = 0; i < numbered.length; i += 1) {
    for (let j = i + 1; j < numbered.length; j += 1) {
      const a = numbered[i];
      const b = numbered[j];
      const delta = Math.abs((a.bpmValue ?? 0) - (b.bpmValue ?? 0));
      if (delta < 40) continue;
      tempoCovered = true;
      warnings.push({
        id: pairId("bpm", a, b),
        messageZh: `速度數值互相拉扯：${a.name} 與 ${b.name}。建議只留一個 BPM，否則節拍會被兩邊拉散。`,
      });
    }
  }

  if (!tempoCovered && slow.length && fast.length) {
    warnings.push({
      id: pairId("tempo", slow[0], fast[0]),
      messageZh: `速度方向相反：「${slow[0].nameZh}」偏慢，而「${fast[0].nameZh}」偏快。可以留著實驗，但生成容易不穩。`,
    });
  } else if (slow.length && club.length) {
    const clubIsFast = club.some((concept) => concept.tempo === "fast");
    if (!clubIsFast) {
      warnings.push({
        id: pairId("club", slow[0], club[0]),
        messageZh: `「${slow[0].nameZh}」偏慢或沒有節拍，但「${club[0].nameZh}」在要俱樂部速度。兩者可以並存，只是主軸會變糊。`,
      });
    }
  }

  const low = selected.filter((concept) => concept.energy === "low");
  const high = selected.filter((concept) => concept.energy === "high");
  if (low.length && high.length) {
    warnings.push({
      id: pairId("energy", low[0], high[0]),
      messageZh: `能量衝突：「${low[0].nameZh}」很靜，而「${high[0].nameZh}」很衝。融合可以很有趣，但模型容易兩邊都做不滿。`,
    });
  }

  const instrumental = selected.find((concept) => concept.id === "instrumental");
  const vocal = selected.find((concept) => concept.vocal);
  if (instrumental && vocal) {
    warnings.push({
      id: pairId("vocal", instrumental, vocal),
      messageZh: `「純音樂」與人聲標籤「${vocal.nameZh}」同時存在，人聲可能被抵銷。`,
    });
  }

  for (const item of analysis.dropped) {
    warnings.push({
      id: `redundancy:${item.concept.id}:${item.because.id}`,
      messageZh: redundancyMessage(item),
    });
  }

  if (selected.length >= OVERLOAD_CONCEPTS) {
    warnings.push({
      id: "overload:concepts",
      messageZh: "目前的 Prompt 包含較多互相競爭的方向，可能會讓生成結果變得不穩定。",
    });
  }
  const genreCount = selected.filter((concept) => concept.category === "genre").length;
  if (genreCount >= OVERLOAD_GENRES) {
    warnings.push({
      id: "overload:genres",
      messageZh: "同時選了多個流派。請確認誰是主流派，其餘只當作影響，否則骨架會被拉散。",
    });
  }

  return warnings;
}

function redundancyMessage(item: DroppedConcept): string {
  return `「${item.concept.nameZh}」與「${item.because.nameZh}」過於接近，Prompt 會保留較具體的 ${item.because.name}。`;
}

function pairId(kind: string, a: Concept, b: Concept): string {
  return `${kind}:${[a.id, b.id].sort().join("+")}`;
}
