import React from 'react';
import { Sparkles, History } from 'lucide-react';
import { useHistoryStore } from '../../stores/historyStore';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const { setIsOpen, items } = useHistoryStore();

  return (
    <header className="h-14 bg-bg-secondary border-b border-gray-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h1 className="text-xl font-bold text-white">
            VibeCode <span className="text-purple-400">Arena</span>
          </h1>
        </div>
        <span className="text-xs text-gray-500 bg-bg-tertiary px-2 py-1 rounded">
          Multi-Agent AI Coding
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* 히스토리 버튼 */}
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
          <History className="w-4 h-4 mr-2" />
          히스토리
          {items.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-500/30 text-purple-300 rounded">
              {items.length}
            </span>
          )}
        </Button>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>2 Agents Active</span>
        </div>
      </div>
    </header>
  );
};
