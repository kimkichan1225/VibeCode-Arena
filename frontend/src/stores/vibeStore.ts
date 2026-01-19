import { create } from 'zustand';
import { VibeTone } from '../types';

interface VibeState {
  prompt: string;
  tone: VibeTone;
  language: string;
  isProcessing: boolean;

  setPrompt: (prompt: string) => void;
  setTone: (tone: VibeTone) => void;
  setLanguage: (language: string) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  reset: () => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  prompt: '',
  tone: 'clean',
  language: 'typescript',
  isProcessing: false,

  setPrompt: (prompt) => set({ prompt }),
  setTone: (tone) => set({ tone }),
  setLanguage: (language) => set({ language }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  reset: () =>
    set({
      prompt: '',
      tone: 'clean',
      language: 'typescript',
      isProcessing: false,
    }),
}));
