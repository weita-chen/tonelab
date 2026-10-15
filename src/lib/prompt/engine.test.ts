import assert from "node:assert/strict";
import { CONCEPTS, orderedGenres } from "../music/index.ts";
import { PRESETS } from "../presets.ts";
import { detectConflicts } from "./conflicts.ts";
import { buildPrompt } from "./engine.ts";

assert.equal(orderedGenres().length, 30);

const ids = new Set(CONCEPTS.map((concept) => concept.id));
for (const preset of PRESETS) {
  for (const id of preset.selectedIds) {
    assert.ok(ids.has(id), `preset ${preset.id} missing ${id}`);
  }
  assert.ok(ids.has(preset.primaryGenreId), preset.primaryGenreId);
}

const jazz = buildPrompt(
  ["jazz", "rock", "melancholic", "era-1970s", "warm-tape", "rhodes", "tenor-sax", "walking-bass", "bpm-90"],
  "jazz",
);
assert.match(jazz.prompt, /^Jazz with rock influence,/);
assert.ok(jazz.prompt.indexOf("melancholic") < jazz.prompt.indexOf("1970s-inspired production"));
assert.ok(jazz.prompt.indexOf("1970s-inspired production") < jazz.prompt.indexOf("warm analog tape texture"));
assert.ok(jazz.prompt.indexOf("warm analog tape texture") < jazz.prompt.indexOf("Rhodes piano"));
assert.ok(jazz.prompt.indexOf("Rhodes piano") < jazz.prompt.indexOf("walking bass"));
assert.ok(jazz.prompt.indexOf("walking bass") < jazz.prompt.indexOf("90 BPM"));
assert.equal(jazz.sections[0]?.id, "primary");

const style = buildPrompt(["jazz", "cool-jazz", "rock"], "jazz");
assert.match(style.prompt, /^Jazz with rock influence, cool jazz/);
assert.equal(style.influences.map((concept) => concept.id).join(), "rock");

const specific = buildPrompt(["jazz", "cool-jazz"], "cool-jazz");
assert.match(specific.prompt, /^Cool jazz/);
assert.ok(specific.dropped.some((item) => item.concept.id === "jazz"));

const redundant = buildPrompt(["warm", "warm-tape"], null);
assert.match(redundant.prompt, /warm analog tape texture/i);
assert.doesNotMatch(redundant.prompt, /\bwarm,/);
assert.ok(redundant.dropped.some((item) => item.concept.id === "warm"));

const slowFast = detectConflicts(["bpm-ballad", "bpm-180"], null);
assert.ok(slowFast.some((warning) => warning.id.startsWith("bpm:")));

const energy = detectConflicts(["ambient", "punk"], "ambient");
assert.ok(energy.some((warning) => warning.id.startsWith("energy:")));

const vocal = detectConflicts(["instrumental", "operatic"], null);
assert.ok(vocal.some((warning) => warning.id.startsWith("vocal:")));

console.log("prompt engine ok");
console.log(jazz.prompt);
