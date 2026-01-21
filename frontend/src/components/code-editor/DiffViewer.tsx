import React, { useState, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { GitCompare, X } from 'lucide-react';

interface DiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  language: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  modifiedCode,
  language,
  isOpen,
  onClose,
}) => {
  // DiffEditor를 지연 마운트하여 애니메이션 종료 후 정리 문제 해결
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 모달 열릴 때 약간의 지연 후 에디터 표시
      const timer = setTimeout(() => setShowEditor(true), 100);
      return () => clearTimeout(timer);
    } else {
      // 모달 닫힐 때 즉시 에디터 숨기기
      setShowEditor(false);
    }
  }, [isOpen]);

  // 모달이 닫혀있으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;
  const getEditorLanguage = () => {
    switch (language) {
      case 'typescript':
        return 'typescript';
      case 'javascript':
        return 'javascript';
      case 'python':
        return 'python';
      default:
        return 'typescript';
    }
  };

  // 변경 통계 계산
  const calculateStats = () => {
    const originalLines = originalCode.split('\n');
    const modifiedLines = modifiedCode.split('\n');

    let added = 0;
    let removed = 0;

    // 간단한 diff 계산 (라인 단위)
    const originalSet = new Set(originalLines);
    const modifiedSet = new Set(modifiedLines);

    for (const line of modifiedLines) {
      if (!originalSet.has(line) && line.trim()) {
        added++;
      }
    }

    for (const line of originalLines) {
      if (!modifiedSet.has(line) && line.trim()) {
        removed++;
      }
    }

    return { added, removed };
  };

  const stats = calculateStats();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-[90vw] h-[85vh] bg-bg-secondary rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-bg-tertiary border-b border-gray-700">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">코드 변경 비교</h3>
            <div className="flex items-center gap-3 ml-4">
              <span className="flex items-center gap-1 text-sm">
                <span className="w-3 h-3 rounded bg-green-500" />
                <span className="text-green-400">+{stats.added} 추가</span>
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span className="w-3 h-3 rounded bg-red-500" />
                <span className="text-red-400">-{stats.removed} 삭제</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-bg-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 라벨 */}
        <div className="flex border-b border-gray-700">
          <div className="flex-1 px-4 py-2 bg-red-500/10 border-r border-gray-700">
            <span className="text-sm text-red-400">초기 생성 (v1)</span>
          </div>
          <div className="flex-1 px-4 py-2 bg-green-500/10">
            <span className="text-sm text-green-400">최종 코드 (v2)</span>
          </div>
        </div>

        {/* Diff 에디터 */}
        <div className="h-[calc(100%-100px)]">
          {showEditor ? (
            <DiffEditor
              key={`${originalCode.length}-${modifiedCode.length}`}
              original={originalCode}
              modified={modifiedCode}
              language={getEditorLanguage()}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                renderSideBySide: true,
                automaticLayout: true,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                fontLigatures: true,
                lineNumbers: 'on',
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              에디터 로딩 중...
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
