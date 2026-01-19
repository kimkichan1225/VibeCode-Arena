import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Sparkles,
  FileCode,
  Layers,
  FolderPlus,
  TestTube,
  Palette,
  ChevronDown,
  FolderOpen,
} from 'lucide-react';
import { useVibeStore } from '../../stores/vibeStore';
import { useProjectStore } from '../../stores/projectStore';
import { useSocket } from '../../hooks/useSocket';
import { TONE_OPTIONS, LANGUAGE_OPTIONS } from '../../constants/agents';
import { Button } from '../common/Button';
import { GenerationMode, VibeTone } from '../../types';
import { FileExplorer } from '../file-explorer/FileExplorer';

const FRAMEWORK_OPTIONS = [
  { value: 'react', label: 'React', icon: '⚛️' },
  { value: 'vue', label: 'Vue', icon: '💚' },
  { value: 'svelte', label: 'Svelte', icon: '🔥' },
  { value: 'vanilla', label: 'Vanilla', icon: '📜' },
];

export const VibeInputPanel: React.FC = () => {
  const { prompt, tone, language, isProcessing, setPrompt, setTone, setLanguage } =
    useVibeStore();
  const { mode, setMode, isGenerating } = useProjectStore();
  const { sendVibeRequest, sendProjectRequest } = useSocket();

  // 프로젝트 모드 설정
  const [projectName, setProjectName] = useState('');
  const [basePath, setBasePath] = useState('');
  const [framework, setFramework] = useState<'react' | 'vue' | 'svelte' | 'vanilla'>('react');
  const [includeTests, setIncludeTests] = useState(true);
  const [includeStyles, setIncludeStyles] = useState(true);
  const [showFileExplorer, setShowFileExplorer] = useState(false);

  const handleSubmit = () => {
    if (!prompt.trim() || isProcessing || isGenerating) return;

    if (mode === 'project') {
      if (!projectName.trim()) return;
      sendProjectRequest({
        prompt,
        projectName,
        basePath,
        tone: tone as VibeTone,
        language,
        framework,
        includeTests,
        includeStyles,
        selectedFiles: [],
      });
    } else {
      sendVibeRequest(prompt, tone, language);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const isLoading = isProcessing || isGenerating;
  const canSubmit = prompt.trim() && (mode === 'single' || projectName.trim());

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      {/* 헤더 */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-700">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">바이브 입력</h2>
      </div>

      {/* 모드 전환 탭 */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-700">
        <button
          onClick={() => setMode('single')}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
            mode === 'single'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <FileCode className="w-4 h-4" />
          단일 파일
        </button>
        <button
          onClick={() => setMode('project')}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
            mode === 'project'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          프로젝트
        </button>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 프로젝트 모드 설정 */}
        <AnimatePresence>
          {mode === 'project' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* 프로젝트 이름 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  프로젝트 이름 *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-project"
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 프레임워크 선택 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  프레임워크
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {FRAMEWORK_OPTIONS.map((fw) => (
                    <button
                      key={fw.value}
                      onClick={() => setFramework(fw.value as typeof framework)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded border transition-all ${
                        framework === fw.value
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-sm">{fw.icon}</span>
                      <span className="text-[10px]">{fw.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 옵션 토글 */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTests}
                    onChange={(e) => setIncludeTests(e.target.checked)}
                    disabled={isLoading}
                    className="w-3.5 h-3.5 rounded border-gray-600 bg-bg-tertiary text-purple-500"
                  />
                  <TestTube className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-gray-300">테스트</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStyles}
                    onChange={(e) => setIncludeStyles(e.target.checked)}
                    disabled={isLoading}
                    className="w-3.5 h-3.5 rounded border-gray-600 bg-bg-tertiary text-purple-500"
                  />
                  <Palette className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-xs text-gray-300">스타일</span>
                </label>
              </div>

              {/* 저장 위치 선택 */}
              <button
                onClick={() => setShowFileExplorer(!showFileExplorer)}
                disabled={isLoading}
                className="flex items-center gap-2 w-full p-2 bg-bg-tertiary rounded-lg border border-gray-600 hover:border-gray-500 transition-colors text-left"
              >
                <FolderOpen className="w-4 h-4 text-yellow-400" />
                <span className="flex-1 text-xs text-gray-300 truncate">
                  {basePath || '저장 위치 선택 (선택사항)'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    showFileExplorer ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 파일 탐색기 */}
              <AnimatePresence>
                {showFileExplorer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 200 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg overflow-hidden"
                  >
                    <FileExplorer
                      onPathChange={(path) => setBasePath(path)}
                      initialPath={basePath}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 프롬프트 입력 */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            {mode === 'project' ? '어떤 프로젝트를 만들까요?' : '무엇을 만들까요?'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'project'
                ? '예: Todo 앱을 만들어줘. 추가/삭제/완료 기능 포함'
                : '예: 로그인 폼 만들어줘'
            }
            className="w-full h-24 px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">Ctrl+Enter로 실행</p>
        </div>

        {/* 톤 선택 */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">코드 스타일</label>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTone(option.value)}
                disabled={isLoading}
                className={`p-2 rounded-lg border text-left transition-all ${
                  tone === option.value
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-700 bg-bg-tertiary hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span className="text-sm font-medium text-white">
                    {option.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{option.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 언어 선택 */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">언어</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 실행 버튼 영역 (고정) */}
      <div className="p-4 border-t border-gray-700">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          isLoading={isLoading}
          size="lg"
          className="w-full"
        >
          {mode === 'project' ? (
            <>
              <FolderPlus className="w-5 h-5 mr-2" />
              프로젝트 생성
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              실행
            </>
          )}
        </Button>

        {/* 에이전트 정보 */}
        <p className="text-xs text-gray-500 text-center mt-3">
          2개의 AI 에이전트가 협력하여
          <br />
          {mode === 'project' ? '프로젝트를 생성합니다' : '최적의 코드를 생성합니다'}
        </p>
      </div>
    </div>
  );
};
