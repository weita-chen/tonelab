import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getConcept } from "@/lib/music";

export type HistoryEntry = {
  id: string;
  timestamp: number;
  prompt: string;
  selectedIds: string[];
  primaryGenreId: string | null;
  customPrompt: string | null;
};

export type Favorite = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  selectedIds: string[];
  primaryGenreId: string | null;
  customPrompt: string | null;
};

type LoadConfig = {
  selectedIds: string[];
  primaryGenreId: string | null;
  customPrompt?: string | null;
  favoriteId?: string | null;
};

type WorkshopState = {
  selectedIds: string[];
  primaryGenreId: string | null;
  customPrompt: string | null;
  history: HistoryEntry[];
  favorites: Favorite[];
  activeFavoriteId: string | null;
  dismissedWarningIds: string[];
  toggleConcept: (id: string) => void;
  removeConcept: (id: string) => void;
  setPrimaryGenre: (id: string) => void;
  clearBuilder: () => void;
  setCustomPrompt: (value: string | null) => void;
  dismissWarning: (id: string) => void;
  loadConfiguration: (config: LoadConfig) => void;
  pushHistory: (prompt: string) => void;
  deleteHistory: (id: string) => void;
  saveFavorite: (name: string) => string | null;
  updateFavorite: (id: string) => void;
  renameFavorite: (id: string, name: string) => void;
  deleteFavorite: (id: string) => void;
};

const HISTORY_LIMIT = 30;
const FAVORITE_LIMIT = 40;

function cleanIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const id of ids) {
    if (seen.has(id) || !getConcept(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

function nextPrimary(ids: string[], current: string | null): string | null {
  if (current && ids.includes(current) && getConcept(current)?.category === "genre") return current;
  return ids.find((id) => getConcept(id)?.category === "genre") ?? null;
}

export const useWorkshop = create<WorkshopState>()(
  persist(
    (set, get) => ({
      selectedIds: [],
      primaryGenreId: null,
      customPrompt: null,
      history: [],
      favorites: [],
      activeFavoriteId: null,
      dismissedWarningIds: [],

      toggleConcept: (id) => {
        if (!getConcept(id)) return;
        const state = get();
        if (state.selectedIds.includes(id)) {
          state.removeConcept(id);
          return;
        }
        const selectedIds = [...state.selectedIds, id];
        const primaryGenreId =
          getConcept(id)?.category === "genre" ? (state.primaryGenreId ?? id) : state.primaryGenreId;
        set({ selectedIds, primaryGenreId });
      },

      removeConcept: (id) => {
        const selectedIds = get().selectedIds.filter((item) => item !== id);
        set({
          selectedIds,
          primaryGenreId: nextPrimary(selectedIds, get().primaryGenreId),
          activeFavoriteId: get().activeFavoriteId,
        });
      },

      setPrimaryGenre: (id) => {
        const concept = getConcept(id);
        if (!concept || concept.category !== "genre" || !get().selectedIds.includes(id)) return;
        set({ primaryGenreId: id });
      },

      clearBuilder: () => {
        set({
          selectedIds: [],
          primaryGenreId: null,
          customPrompt: null,
          activeFavoriteId: null,
          dismissedWarningIds: [],
        });
      },

      setCustomPrompt: (value) => set({ customPrompt: value }),

      dismissWarning: (id) => {
        const current = get().dismissedWarningIds;
        if (current.includes(id)) return;
        set({ dismissedWarningIds: [...current, id] });
      },

      loadConfiguration: (config) => {
        const selectedIds = cleanIds(config.selectedIds);
        set({
          selectedIds,
          primaryGenreId: nextPrimary(selectedIds, config.primaryGenreId),
          customPrompt: config.customPrompt ?? null,
          activeFavoriteId: config.favoriteId ?? null,
          dismissedWarningIds: [],
        });
      },

      pushHistory: (prompt) => {
        const text = prompt.trim();
        if (!text) return;
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          prompt: text,
          selectedIds: get().selectedIds,
          primaryGenreId: get().primaryGenreId,
          customPrompt: get().customPrompt,
        };
        set({ history: [entry, ...get().history].slice(0, HISTORY_LIMIT) });
      },

      deleteHistory: (id) => set({ history: get().history.filter((item) => item.id !== id) }),

      saveFavorite: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const now = Date.now();
        const favorite: Favorite = {
          id: crypto.randomUUID(),
          name: trimmed,
          createdAt: now,
          updatedAt: now,
          selectedIds: get().selectedIds,
          primaryGenreId: get().primaryGenreId,
          customPrompt: get().customPrompt,
        };
        set({
          favorites: [favorite, ...get().favorites].slice(0, FAVORITE_LIMIT),
          activeFavoriteId: favorite.id,
        });
        return favorite.id;
      },

      updateFavorite: (id) => {
        set({
          favorites: get().favorites.map((favorite) =>
            favorite.id === id
              ? {
                  ...favorite,
                  updatedAt: Date.now(),
                  selectedIds: get().selectedIds,
                  primaryGenreId: get().primaryGenreId,
                  customPrompt: get().customPrompt,
                }
              : favorite,
          ),
          activeFavoriteId: id,
        });
      },

      renameFavorite: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set({
          favorites: get().favorites.map((favorite) =>
            favorite.id === id ? { ...favorite, name: trimmed, updatedAt: Date.now() } : favorite,
          ),
        });
      },

      deleteFavorite: (id) => {
        set({
          favorites: get().favorites.filter((favorite) => favorite.id !== id),
          activeFavoriteId: get().activeFavoriteId === id ? null : get().activeFavoriteId,
        });
      },
    }),
    {
      name: "suno-prompt-workshop",
      skipHydration: true,
      partialize: (state) => ({
        selectedIds: state.selectedIds,
        primaryGenreId: state.primaryGenreId,
        customPrompt: state.customPrompt,
        history: state.history,
        favorites: state.favorites,
        activeFavoriteId: state.activeFavoriteId,
      }),
    },
  ),
);
