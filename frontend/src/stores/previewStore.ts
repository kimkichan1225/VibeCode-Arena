import { create } from 'zustand';

interface PreviewState {
  // 미리보기 관련 상태
  code: string;
  componentName: string;
  isTypeScript: boolean;
  isRunning: boolean;
  iframeKey: number;

  // 액션
  setPreviewCode: (code: string, componentName: string, isTypeScript: boolean) => void;
  setIsRunning: (running: boolean) => void;
  reloadPreview: () => void;
  reset: () => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  code: '',
  componentName: 'App',
  isTypeScript: false,
  isRunning: false,
  iframeKey: 0,

  setPreviewCode: (code, componentName, isTypeScript) =>
    set((state) => ({
      code,
      componentName,
      isTypeScript,
      iframeKey: state.iframeKey + 1,
    })),

  setIsRunning: (running) => set({ isRunning: running }),

  reloadPreview: () => set((state) => ({ iframeKey: state.iframeKey + 1 })),

  reset: () =>
    set({
      code: '',
      componentName: 'App',
      isTypeScript: false,
      isRunning: false,
      iframeKey: 0,
    }),
}));
