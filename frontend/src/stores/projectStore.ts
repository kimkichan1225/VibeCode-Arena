import { create } from 'zustand';
import { GenerationMode, ProjectFile, ProjectResult } from '../types';

interface ProjectState {
  mode: GenerationMode;
  projectName: string;
  basePath: string;
  files: ProjectFile[];
  isGenerating: boolean;
  result: ProjectResult | null;
  error: string | null;

  // Actions
  setMode: (mode: GenerationMode) => void;
  setProjectName: (name: string) => void;
  setBasePath: (path: string) => void;
  setFiles: (files: ProjectFile[]) => void;
  addFile: (file: ProjectFile) => void;
  updateFile: (path: string, content: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setResult: (result: ProjectResult | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  mode: 'single' as GenerationMode,
  projectName: '',
  basePath: '',
  files: [],
  isGenerating: false,
  result: null,
  error: null,
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setProjectName: (projectName) => set({ projectName }),
  setBasePath: (basePath) => set({ basePath }),
  setFiles: (files) => set({ files }),
  addFile: (file) =>
    set((state) => ({
      files: [...state.files.filter((f) => f.path !== file.path), file],
    })),
  updateFile: (path, content) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.path === path ? { ...f, content } : f
      ),
    })),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
