import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  File,
  ChevronRight,
  RefreshCw,
  FileCode,
  FileJson,
  FileText,
  Home,
  ArrowUp,
} from 'lucide-react';
import { FileInfo } from '../../types';
import { Button } from '../common/Button';

interface FileExplorerProps {
  onFileSelect?: (file: FileInfo) => void;
  onPathChange?: (path: string) => void;
  initialPath?: string;
  selectable?: boolean;
  multiSelect?: boolean;
  selectedFiles?: string[];
  onSelectedFilesChange?: (files: string[]) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const FileExplorer: React.FC<FileExplorerProps> = ({
  onFileSelect,
  onPathChange,
  initialPath,
  selectable = false,
  multiSelect = false,
  selectedFiles = [],
  onSelectedFilesChange,
}) => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath || '');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 디렉토리 내용 로드
  const loadDirectory = async (path?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = path
        ? `${API_BASE}/api/files/list?path=${encodeURIComponent(path)}`
        : `${API_BASE}/api/files/list`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '디렉토리를 불러올 수 없습니다.');
      }

      setFiles(data.files);
      setCurrentPath(data.currentPath);
      onPathChange?.(data.currentPath);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadDirectory(initialPath);
  }, [initialPath]);

  // 폴더로 이동
  const navigateToFolder = (path: string) => {
    loadDirectory(path);
  };

  // 상위 폴더로 이동
  const navigateUp = () => {
    const parentPath = currentPath.split(/[/\\]/).slice(0, -1).join('\\');
    if (parentPath) {
      loadDirectory(parentPath);
    }
  };

  // 파일 클릭
  const handleFileClick = (file: FileInfo) => {
    if (selectable) {
      if (multiSelect) {
        const newSelected = selectedFiles.includes(file.path)
          ? selectedFiles.filter((f) => f !== file.path)
          : [...selectedFiles, file.path];
        onSelectedFilesChange?.(newSelected);
      } else {
        onSelectedFilesChange?.([file.path]);
      }
    }
    onFileSelect?.(file);
  };

  // 파일 아이콘 가져오기
  const getFileIcon = (file: FileInfo) => {
    if (file.isDirectory) {
      return <Folder className="w-4 h-4 text-yellow-400" />;
    }

    const ext = file.extension?.toLowerCase();
    switch (ext) {
      case '.ts':
      case '.tsx':
      case '.js':
      case '.jsx':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case '.json':
        return <FileJson className="w-4 h-4 text-yellow-400" />;
      case '.md':
      case '.txt':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case '.css':
      case '.scss':
        return <File className="w-4 h-4 text-pink-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  // 파일 크기 포맷
  const formatSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 경로 분할
  const pathParts = currentPath.split(/[/\\]/).filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-bg-secondary rounded-lg border border-gray-700">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-medium text-white">파일 탐색기</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={navigateUp} disabled={!currentPath}>
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => loadDirectory(currentPath)}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 경로 바 */}
      <div className="flex items-center gap-1 p-2 bg-bg-tertiary border-b border-gray-700 overflow-x-auto">
        <button
          onClick={() => loadDirectory('')}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <Home className="w-4 h-4 text-gray-400" />
        </button>
        {pathParts.map((part, index) => (
          <div key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-500" />
            <button
              onClick={() =>
                navigateToFolder(pathParts.slice(0, index + 1).join('\\'))
              }
              className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded truncate max-w-[100px]"
            >
              {part}
            </button>
          </div>
        ))}
      </div>

      {/* 파일 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {error ? (
          <div className="text-center py-8 text-red-400 text-sm">{error}</div>
        ) : loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            불러오는 중...
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            빈 디렉토리입니다.
          </div>
        ) : (
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <button
                  onClick={() =>
                    file.isDirectory
                      ? navigateToFolder(file.path)
                      : handleFileClick(file)
                  }
                  className={`w-full flex items-center gap-2 p-2 rounded hover:bg-gray-700/50 transition-colors ${
                    selectedFiles.includes(file.path)
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : ''
                  }`}
                >
                  {file.isDirectory && (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  )}
                  {!file.isDirectory && <div className="w-3" />}
                  {getFileIcon(file)}
                  <span className="flex-1 text-left text-sm text-gray-200 truncate">
                    {file.name}
                  </span>
                  {!file.isDirectory && (
                    <span className="text-xs text-gray-500">
                      {formatSize(file.size)}
                    </span>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 선택된 파일 수 */}
      {selectable && selectedFiles.length > 0 && (
        <div className="p-2 border-t border-gray-700 bg-bg-tertiary">
          <span className="text-xs text-gray-400">
            {selectedFiles.length}개 파일 선택됨
          </span>
        </div>
      )}
    </div>
  );
};
