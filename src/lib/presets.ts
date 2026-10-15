export type Preset = {
  id: string;
  name: string;
  nameZh: string;
  blurbZh: string;
  selectedIds: string[];
  primaryGenreId: string;
};

export const PRESETS: Preset[] = [
  {
    id: "late-night-jazz",
    name: "Late Night Jazz",
    nameZh: "深夜爵士",
    blurbZh: "酷派、弱音薩克斯與黑膠夜色。",
    primaryGenreId: "jazz",
    selectedIds: ["jazz", "cool-jazz", "smoky", "era-1950s", "vinyl-crackle", "muted-sax", "double-bass", "brushed-drums", "swing", "bpm-90"],
  },
  {
    id: "rainy-piano",
    name: "Rainy Day Piano",
    nameZh: "雨天鋼琴",
    blurbZh: "專注與氛圍之間的慢鋼琴。",
    primaryGenreId: "study",
    selectedIds: ["study", "ambient", "melancholic", "intimate", "lofi", "vinyl-crackle", "acoustic-piano", "chillhop", "bpm-down"],
  },
  {
    id: "cinematic-synth",
    name: "80s Cinematic Synth",
    nameZh: "80 年代電影合成器",
    blurbZh: "合成波、閘門鼓與配樂影響。",
    primaryGenreId: "retro",
    selectedIds: ["retro", "soundtrack", "synthwave", "nostalgic", "era-1980s", "analog-synth", "gated-reverb", "drum-machine"],
  },
  {
    id: "workout-rock",
    name: "Aggressive Workout Rock",
    nameZh: "高能健身搖滾",
    blurbZh: "失真吉他與 150 BPM。",
    primaryGenreId: "rock",
    selectedIds: ["rock", "workout", "aggressive", "overdrive", "distorted-guitar", "rock-kit", "driving-drums", "bpm-150"],
  },
  {
    id: "cyberpunk-electronic",
    name: "Cyberpunk Electronic",
    nameZh: "賽博龐克電子",
    blurbZh: "暗色合成器與霓虹光澤。",
    primaryGenreId: "edm",
    selectedIds: ["edm", "cyberpunk", "dark", "hypnotic", "neon-sheen", "dark-synth", "arpeggiator", "bpm-128"],
  },
  {
    id: "warm-indie-folk",
    name: "Warm Indie Folk",
    nameZh: "溫暖獨立民謠",
    blurbZh: "指彈木吉他與磁帶溫度。",
    primaryGenreId: "folk",
    selectedIds: ["folk", "indie-folk", "heartfelt", "warm-tape", "acoustic-guitar", "fingerpicking", "cello", "bpm-ballad"],
  },
  {
    id: "lofi-study-desk",
    name: "Lo-Fi Study",
    nameZh: "專注 Lo-Fi",
    blurbZh: "手冊範本：Rhodes、黑膠與慢鼓。",
    primaryGenreId: "study",
    selectedIds: ["study", "lofi-study", "relaxed", "rhodes", "vinyl-crackle", "chillhop", "bpm-down"],
  },
  {
    id: "epic-trailer",
    name: "Epic Trailer",
    nameZh: "史詩預告配樂",
    blurbZh: "弦樂、銅管與預告堆疊。",
    primaryGenreId: "soundtrack",
    selectedIds: ["soundtrack", "epic-trailer", "epic", "cinematic-wide", "string-ensemble", "brass-section", "timpani", "trailer-buildup"],
  },
  {
    id: "country-cyberpunk",
    name: "Country Cyberpunk",
    nameZh: "鄉村 × 賽博龐克",
    blurbZh: "木吉他敘事壓在暗色電子上。",
    primaryGenreId: "country",
    selectedIds: ["country", "edm", "storytelling", "fingerpicking", "acoustic-guitar", "dark-synth", "neon-sheen", "era-2020s"],
  },
];
