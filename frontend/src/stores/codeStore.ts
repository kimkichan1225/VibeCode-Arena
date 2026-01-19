import { create } from 'zustand';

interface CodeState {
  code: string;
  versions: string[];
  currentVersion: number;
  highlightedLines: number[];

  setCode: (code: string) => void;
  addVersion: (code: string) => void;
  setCurrentVersion: (version: number) => void;
  setHighlightedLines: (lines: number[]) => void;
  reset: () => void;
}

export const useCodeStore = create<CodeState>((set) => ({
  code: '',
  versions: [],
  currentVersion: 0,
  highlightedLines: [],

  setCode: (code) => set({ code }),
  addVersion: (code) =>
    set((state) => {
      // 마지막 버전과 같으면 추가하지 않음 (중복 방지)
      const lastVersion = state.versions[state.versions.length - 1];
      if (lastVersion === code) {
        return state;
      }
      return {
        versions: [...state.versions, code],
        currentVersion: state.versions.length,
        code,
      };
    }),
  setCurrentVersion: (version) =>
    set((state) => ({
      currentVersion: version,
      code: state.versions[version] || '',
    })),
  setHighlightedLines: (lines) => set({ highlightedLines: lines }),
  reset: () =>
    set({
      code: '',
      versions: [],
      currentVersion: 0,
      highlightedLines: [],
    }),
}));
