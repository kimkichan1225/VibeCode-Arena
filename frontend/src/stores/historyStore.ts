import { create } from 'zustand';
import { historyService, HistoryItem } from '../services/historyService';

interface HistoryState {
  items: HistoryItem[];
  selectedItem: HistoryItem | null;
  isOpen: boolean;

  loadHistory: () => void;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  deleteFromHistory: (id: string) => void;
  clearHistory: () => void;
  selectItem: (item: HistoryItem | null) => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],
  selectedItem: null,
  isOpen: false,

  loadHistory: () => {
    const items = historyService.getAll();
    set({ items });
  },

  addToHistory: (item) => {
    historyService.add(item);
    const items = historyService.getAll();
    set({ items });
  },

  deleteFromHistory: (id) => {
    historyService.delete(id);
    const items = historyService.getAll();
    set((state) => ({
      items,
      selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
    }));
  },

  clearHistory: () => {
    historyService.clear();
    set({ items: [], selectedItem: null });
  },

  selectItem: (item) => {
    set({ selectedItem: item });
  },

  setIsOpen: (isOpen) => {
    set({ isOpen });
  },
}));
