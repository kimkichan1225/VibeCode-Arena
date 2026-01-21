import { create } from 'zustand';
import { VibeTone } from '../types';

interface VibeState {
  prompt: string;
  tone: VibeTone;
  language: string;
  isProcessing: boolean;
  // 수정 모드
  isModificationMode: boolean;
  existingCode: string;

  setPrompt: (prompt: string) => void;
  setTone: (tone: VibeTone) => void;
  setLanguage: (language: string) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  // 수정 모드 액션
  startModification: (code: string) => void;
  cancelModification: () => void;
  reset: () => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  prompt: '',
  tone: 'clean',
  language: 'typescript',
  isProcessing: false,
  isModificationMode: false,
  existingCode: '',

  setPrompt: (prompt) => set({ prompt }),
  setTone: (tone) => set({ tone }),
  setLanguage: (language) => set({ language }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  startModification: (code) => set({ isModificationMode: true, existingCode: code, prompt: '' }),
  cancelModification: () => set({ isModificationMode: false, existingCode: '', prompt: '' }),
  reset: () =>
    set({
      prompt: '',
      tone: 'clean',
      language: 'typescript',
      isProcessing: false,
      isModificationMode: false,
      existingCode: '',
    }),
}));
