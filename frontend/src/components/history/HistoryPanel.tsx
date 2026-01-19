import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Trash2, Clock, Code, Star, Search } from 'lucide-react';
import { useHistoryStore } from '../../stores/historyStore';
import { useVibeStore } from '../../stores/vibeStore';
import { useCodeStore } from '../../stores/codeStore';
import { TONE_OPTIONS } from '../../constants/agents';
import { Button } from '../common/Button';
import { HistoryItem } from '../../services/historyService';

export const HistoryPanel: React.FC = () => {
  const {
    items,
    isOpen,
    loadHistory,
    deleteFromHistory,
    clearHistory,
    setIsOpen,
  } = useHistoryStore();

  const { setPrompt, setTone, setLanguage } = useVibeStore();
  const { setCode, addVersion } = useCodeStore();

  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredItems = searchQuery
    ? items.filter(
        (item) =>
          item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.finalCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const handleLoadItem = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setTone(item.tone);
    setLanguage(item.language);
    setCode(item.finalCode);

    // 버전 히스토리 복원
    for (const version of item.codeVersions) {
      addVersion(version);
    }

    setIsOpen(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;

    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getToneIcon = (tone: string) => {
    return TONE_OPTIONS.find((t) => t.value === tone)?.icon || '✨';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-[600px] max-h-[80vh] bg-bg-secondary rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 bg-bg-tertiary border-b border-gray-700">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">히스토리</h3>
                <span className="text-sm text-gray-400">({items.length}개)</span>
              </div>

              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearHistory}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    전체 삭제
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-bg-primary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 검색 */}
            <div className="p-3 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="히스토리 검색..."
                  className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* 리스트 */}
            <div className="max-h-[calc(80vh-140px)] overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{searchQuery ? '검색 결과가 없습니다' : '히스토리가 비어있습니다'}</p>
                  <p className="text-sm mt-1">
                    바이브 코딩 결과가 자동으로 저장됩니다
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 hover:bg-bg-tertiary/50 cursor-pointer transition-colors group"
                      onClick={() => handleLoadItem(item)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* 프롬프트 */}
                          <p className="text-white font-medium truncate mb-1">
                            {item.prompt}
                          </p>

                          {/* 메타 정보 */}
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.timestamp)}
                            </span>
                            <span className="flex items-center gap-1">
                              {getToneIcon(item.tone)}
                              {item.tone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Code className="w-3 h-3" />
                              {item.language}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400" />
                              {item.vibeScore}/10
                            </span>
                          </div>

                          {/* 코드 미리보기 */}
                          <pre className="mt-2 text-xs text-gray-500 truncate font-mono">
                            {item.finalCode.split('\n').slice(0, 2).join('\n')}
                          </pre>
                        </div>

                        {/* 삭제 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFromHistory(item.id);
                          }}
                          className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
