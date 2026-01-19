import { VibeTone, AgentMessage, ConsensusResult } from '../types';

export interface HistoryItem {
  id: string;
  prompt: string;
  tone: VibeTone;
  language: string;
  codeVersions: string[];
  finalCode: string;
  vibeScore: number;
  changesApplied: number;
  timestamp: number;
  agentMessages?: AgentMessage[];
  consensus?: ConsensusResult;
}

const STORAGE_KEY = 'vibecode-arena-history';
const MAX_HISTORY_ITEMS = 50;

class HistoryService {
  private getStorage(): HistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveStorage(items: HistoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }

  getAll(): HistoryItem[] {
    return this.getStorage().sort((a, b) => b.timestamp - a.timestamp);
  }

  getById(id: string): HistoryItem | undefined {
    return this.getStorage().find((item) => item.id === id);
  }

  add(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
    const newItem: HistoryItem = {
      ...item,
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    const items = this.getStorage();
    items.unshift(newItem);

    // 최대 개수 제한
    if (items.length > MAX_HISTORY_ITEMS) {
      items.splice(MAX_HISTORY_ITEMS);
    }

    this.saveStorage(items);
    return newItem;
  }

  delete(id: string): void {
    const items = this.getStorage().filter((item) => item.id !== id);
    this.saveStorage(items);
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  search(query: string): HistoryItem[] {
    const lowerQuery = query.toLowerCase();
    return this.getStorage().filter(
      (item) =>
        item.prompt.toLowerCase().includes(lowerQuery) ||
        item.finalCode.toLowerCase().includes(lowerQuery)
    );
  }
}

export const historyService = new HistoryService();
