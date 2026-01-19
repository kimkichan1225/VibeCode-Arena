import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus,
  Layers,
  FileCode,
  TestTube,
  Palette,
  ChevronDown,
  FolderOpen,
  Play,
  X,
} from 'lucide-react';
import { Button } from '../common/Button';
import { FileExplorer } from '../file-explorer/FileExplorer';
import { VibeTone, GenerationMode, FileInfo } from '../../types';
import { TONE_OPTIONS } from '../../constants/agents';

interface ProjectModePanelProps {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  onSubmit: (config: ProjectConfig) => void;
  isLoading: boolean;
}

export interface ProjectConfig {
  prompt: string;
  projectName: string;
  basePath: string;
  tone: VibeTone;
  language: string;
  framework: 'react' | 'vue' | 'svelte' | 'vanilla';
  includeTests: boolean;
  includeStyles: boolean;
  selectedFiles: string[];
}

const FRAMEWORK_OPTIONS = [
  { value: 'react', label: 'React', icon: '⚛️' },
  { value: 'vue', label: 'Vue', icon: '💚' },
  { value: 'svelte', label: 'Svelte', icon: '🔥' },
  { value: 'vanilla', label: 'Vanilla JS', icon: '📜' },
];

const LANGUAGE_OPTIONS = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
];

export const ProjectModePanel: React.FC<ProjectModePanelProps> = ({
  mode,
  onModeChange,
  onSubmit,
  isLoading,
}) => {
  const [config, setConfig] = useState<ProjectConfig>({
    prompt: '',
    projectName: '',
    basePath: '',
    tone: 'clean',
    language: 'typescript',
    framework: 'react',
    includeTests: true,
    includeStyles: true,
    selectedFiles: [],
  });
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = () => {
    if (!config.prompt.trim()) return;
    if (mode === 'project' && !config.projectName.trim()) return;
    onSubmit(config);
  };

  const handleFileSelect = (file: FileInfo) => {
    if (!file.isDirectory) {
      const newFiles = config.selectedFiles.includes(file.path)
        ? config.selectedFiles.filter((f) => f !== file.path)
        : [...config.selectedFiles, file.path];
      setConfig({ ...config, selectedFiles: newFiles });
    }
  };

  const handlePathChange = (path: string) => {
    setConfig({ ...config, basePath: path });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 모드 전환 탭 */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-700">
        <button
          onClick={() => onModeChange('single')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            mode === 'single'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span className="text-sm font-medium">단일 파일</span>
        </button>
        <button
          onClick={() => onModeChange('project')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            mode === 'project'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-sm font-medium">프로젝트 모드</span>
        </button>
      </div>

      {/* 프로젝트 모드 설정 */}
      <AnimatePresence mode="wait">
        {mode === 'project' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-700"
          >
            {/* 프로젝트 이름 */}
            <div className="p-3 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  value={config.projectName}
                  onChange={(e) =>
                    setConfig({ ...config, projectName: e.target.value })
                  }
                  placeholder="my-awesome-project"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 프레임워크 선택 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  프레임워크
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {FRAMEWORK_OPTIONS.map((fw) => (
                    <button
                      key={fw.value}
                      onClick={() =>
                        setConfig({
                          ...config,
                          framework: fw.value as ProjectConfig['framework'],
                        })
                      }
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                        config.framework === fw.value
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-lg">{fw.icon}</span>
                      <span className="text-xs">{fw.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 옵션 토글 */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeTests}
                    onChange={(e) =>
                      setConfig({ ...config, includeTests: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-bg-tertiary text-purple-500 focus:ring-purple-500"
                  />
                  <TestTube className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">테스트 포함</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeStyles}
                    onChange={(e) =>
                      setConfig({ ...config, includeStyles: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-bg-tertiary text-purple-500 focus:ring-purple-500"
                  />
                  <Palette className="w-4 h-4 text-pink-400" />
                  <span className="text-sm text-gray-300">스타일 포함</span>
                </label>
              </div>

              {/* 파일 탐색기 토글 */}
              <button
                onClick={() => setShowFileExplorer(!showFileExplorer)}
                className="flex items-center gap-2 w-full p-2 bg-bg-tertiary rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-yellow-400" />
                <span className="flex-1 text-left text-sm text-gray-300">
                  {config.basePath || '저장 위치 선택...'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    showFileExplorer ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 선택된 파일 */}
              {config.selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {config.selectedFiles.map((file) => (
                    <span
                      key={file}
                      className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded"
                    >
                      {file.split(/[/\\]/).pop()}
                      <button
                        onClick={() =>
                          setConfig({
                            ...config,
                            selectedFiles: config.selectedFiles.filter(
                              (f) => f !== file
                            ),
                          })
                        }
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 파일 탐색기 */}
            <AnimatePresence>
              {showFileExplorer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 300 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-700"
                >
                  <FileExplorer
                    onFileSelect={handleFileSelect}
                    onPathChange={handlePathChange}
                    selectable
                    multiSelect
                    selectedFiles={config.selectedFiles}
                    onSelectedFilesChange={(files) =>
                      setConfig({ ...config, selectedFiles: files })
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 톤 선택 */}
      <div className="p-3 border-b border-gray-700">
        <label className="block text-xs text-gray-400 mb-2">코드 스타일</label>
        <div className="grid grid-cols-4 gap-2">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone.value}
              onClick={() => setConfig({ ...config, tone: tone.value })}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                config.tone === tone.value
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                  : 'border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              <span className="text-lg">{tone.icon}</span>
              <span className="text-xs">{tone.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 언어 선택 (고급 설정) */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center justify-between p-3 border-b border-gray-700 hover:bg-gray-800/30 transition-colors"
      >
        <span className="text-sm text-gray-400">고급 설정</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            showAdvanced ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 border-b border-gray-700"
          >
            <label className="block text-xs text-gray-400 mb-2">언어</label>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setConfig({ ...config, language: lang.value })}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    config.language === lang.value
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 프롬프트 입력 */}
      <div className="flex-1 p-3">
        <textarea
          value={config.prompt}
          onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
          placeholder={
            mode === 'project'
              ? '어떤 프로젝트를 만들까요? (예: 할 일 목록 앱을 만들어줘)'
              : '어떤 코드를 작성할까요?'
          }
          className="w-full h-full min-h-[120px] px-3 py-2 bg-bg-tertiary border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
        />
      </div>

      {/* 제출 버튼 */}
      <div className="p-3 border-t border-gray-700">
        <Button
          onClick={handleSubmit}
          disabled={
            isLoading ||
            !config.prompt.trim() ||
            (mode === 'project' && !config.projectName.trim())
          }
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>생성 중...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {mode === 'project' ? (
                <FolderPlus className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{mode === 'project' ? '프로젝트 생성' : '코드 생성'}</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};
