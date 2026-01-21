import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode,
  FileJson,
  TestTube,
  Palette,
  File,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Save,
  FolderTree,
} from 'lucide-react';
import { ProjectFile, ProjectFileType } from '../../types';
import { Button } from '../common/Button';
import Editor from '@monaco-editor/react';

interface ProjectFilesViewerProps {
  files: ProjectFile[];
  onSaveFiles?: (files: ProjectFile[]) => void;
  basePath?: string;
}

const FILE_TYPE_ICONS: Record<ProjectFileType, React.ReactNode> = {
  component: <FileCode className="w-4 h-4 text-blue-400" />,
  style: <Palette className="w-4 h-4 text-pink-400" />,
  test: <TestTube className="w-4 h-4 text-green-400" />,
  util: <FileCode className="w-4 h-4 text-yellow-400" />,
  config: <FileJson className="w-4 h-4 text-orange-400" />,
  other: <File className="w-4 h-4 text-gray-400" />,
};

const FILE_TYPE_LABELS: Record<ProjectFileType, string> = {
  component: '컴포넌트',
  style: '스타일',
  test: '테스트',
  util: '유틸리티',
  config: '설정',
  other: '기타',
};

export const ProjectFilesViewer: React.FC<ProjectFilesViewerProps> = ({
  files,
  onSaveFiles,
}) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(
    files[0] || null
  );
  const [expandedTypes, setExpandedTypes] = useState<Set<ProjectFileType>>(
    new Set(['component', 'style', 'test', 'util', 'config', 'other'])
  );
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // 파일 타입별 그룹화
  const groupedFiles = files.reduce((acc, file) => {
    if (!acc[file.type]) {
      acc[file.type] = [];
    }
    acc[file.type].push(file);
    return acc;
  }, {} as Record<ProjectFileType, ProjectFile[]>);

  // 타입 토글
  const toggleType = (type: ProjectFileType) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  // 파일 내용 복사
  const copyFileContent = async (file: ProjectFile) => {
    await navigator.clipboard.writeText(file.content);
    setCopiedFile(file.path);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // 모든 파일 저장
  const handleSaveAll = () => {
    onSaveFiles?.(files);
  };

  // 언어 매핑
  const getMonacoLanguage = (language: string) => {
    const map: Record<string, string> = {
      typescript: 'typescript',
      javascript: 'javascript',
      css: 'css',
      scss: 'scss',
      json: 'json',
      html: 'html',
      markdown: 'markdown',
    };
    return map[language] || 'plaintext';
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <FolderTree className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">생성된 파일이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-bg-secondary rounded-lg border border-gray-700">
      {/* 파일 목록 사이드바 */}
      <div className="w-64 border-r border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">
              {files.length}개 파일
            </span>
          </div>
          {onSaveFiles && (
            <Button variant="ghost" size="sm" onClick={handleSaveAll}>
              <Save className="w-4 h-4 mr-1" />
              저장
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {(Object.keys(groupedFiles) as ProjectFileType[]).map((type) => (
            <div key={type} className="mb-2">
              <button
                onClick={() => toggleType(type)}
                className="flex items-center gap-2 w-full p-2 hover:bg-gray-700/50 rounded transition-colors"
              >
                {expandedTypes.has(type) ? (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
                {FILE_TYPE_ICONS[type]}
                <span className="text-sm text-gray-300">
                  {FILE_TYPE_LABELS[type]}
                </span>
                <span className="ml-auto text-xs text-gray-500">
                  {groupedFiles[type].length}
                </span>
              </button>

              <AnimatePresence>
                {expandedTypes.has(type) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4"
                  >
                    {groupedFiles[type].map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        className={`flex items-center gap-2 w-full p-2 rounded text-left transition-colors ${
                          selectedFile?.path === file.path
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                        }`}
                      >
                        <File className="w-3 h-3" />
                        <span className="text-xs truncate">{file.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* 파일 내용 뷰어 */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            {/* 파일 헤더 */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-bg-tertiary">
              <div className="flex items-center gap-2">
                {FILE_TYPE_ICONS[selectedFile.type]}
                <span className="text-sm text-white">{selectedFile.path}</span>
                <span className="px-2 py-0.5 bg-gray-700 text-xs text-gray-400 rounded">
                  {selectedFile.language}
                </span>
              </div>
              <button
                onClick={() => copyFileContent(selectedFile)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="복사"
              >
                {copiedFile === selectedFile.path ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>

            {/* 코드 에디터 */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={getMonacoLanguage(selectedFile.language)}
                value={selectedFile.content}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 16 },
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">파일을 선택하세요</p>
          </div>
        )}
      </div>
    </div>
  );
};
