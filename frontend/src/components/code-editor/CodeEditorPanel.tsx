import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useCodeStore } from '../../stores/codeStore';
import { useVibeStore } from '../../stores/vibeStore';
import { useAgentStore } from '../../stores/agentStore';
import { useProjectStore } from '../../stores/projectStore';
import { Code, Copy, Check, GitCompare, Layers, Pencil } from 'lucide-react';
import { CodeRunner } from './CodeRunner';
import { DiffViewer } from './DiffViewer';
import { ProjectFilesViewer } from '../project-mode/ProjectFilesViewer';
import { Button } from '../common/Button';

export const CodeEditorPanel: React.FC = () => {
  const { code, versions, currentVersion } = useCodeStore();
  const { language, startModification, isModificationMode } = useVibeStore();
  useAgentStore();
  const { mode, files: projectFiles } = useProjectStore();
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleModify = () => {
    if (code) {
      startModification(code);
    }
  };

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

  const canShowDiff = versions.length >= 2;
  const showProjectMode = mode === 'project' && projectFiles.length > 0;

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* 툴바 */}
      <div className="h-10 flex items-center justify-between px-4 bg-bg-secondary border-b border-gray-800">
        <div className="flex items-center gap-2">
          {showProjectMode ? (
            <>
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">프로젝트 파일</span>
              <span className="text-xs text-gray-500 bg-bg-tertiary px-2 py-0.5 rounded">
                {projectFiles.length}개 파일
              </span>
            </>
          ) : (
            <>
              <Code className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">코드 에디터</span>
              {versions.length > 0 && (
                <span className="text-xs text-gray-500 bg-bg-tertiary px-2 py-0.5 rounded">
                  v{currentVersion + 1}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Diff 버튼 */}
          {canShowDiff && (
            <Button variant="ghost" size="sm" onClick={() => setShowDiff(true)}>
              <GitCompare className="w-3 h-3 mr-1" />
              변경 비교
            </Button>
          )}

          {/* 수정 버튼 */}
          {code && !isModificationMode && (
            <Button variant="ghost" size="sm" onClick={handleModify}>
              <Pencil className="w-3 h-3 mr-1" />
              수정하기
            </Button>
          )}

          {/* 복사 버튼 */}
          {code && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>복사</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 에디터 또는 프로젝트 파일 뷰어 */}
      <div className="flex-1 min-h-0">
        {showProjectMode ? (
          <ProjectFilesViewer files={projectFiles} />
        ) : code ? (
          <Editor
            height="100%"
            language={getEditorLanguage()}
            value={code}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16 },
              fontFamily: "'Fira Code', 'Consolas', monospace",
              fontLigatures: true,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              {mode === 'project' ? (
                <>
                  <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">프로젝트 파일이 여기에 표시됩니다</p>
                  <p className="text-sm mt-2">
                    좌측에서 프로젝트 정보를 입력하고 생성하세요
                  </p>
                </>
              ) : (
                <>
                  <Code className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">코드가 여기에 표시됩니다</p>
                  <p className="text-sm mt-2">
                    좌측에서 바이브를 입력하고 실행하세요
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 버전 탭 (단일 파일 모드일 때만) */}
      {!showProjectMode && versions.length > 1 && (
        <div className="h-8 flex items-center gap-1 px-4 bg-bg-secondary border-t border-gray-800">
          <span className="text-xs text-gray-500 mr-2">버전:</span>
          {versions.map((_, index) => (
            <button
              key={index}
              onClick={() => useCodeStore.getState().setCurrentVersion(index)}
              className={`px-2 py-0.5 text-xs rounded ${
                currentVersion === index
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'text-gray-400 hover:bg-bg-tertiary'
              }`}
            >
              v{index + 1}
              {index === 0 && ' (초기)'}
              {index === versions.length - 1 && index > 0 && ' (최종)'}
            </button>
          ))}
        </div>
      )}

      {/* 코드 실행기 (단일 파일 모드일 때만) */}
      {!showProjectMode && code && <CodeRunner code={code} language={language} />}

      {/* Diff 뷰어 */}
      {canShowDiff && (
        <DiffViewer
          originalCode={versions[0] || ''}
          modifiedCode={versions[versions.length - 1] || ''}
          language={language}
          isOpen={showDiff}
          onClose={() => setShowDiff(false)}
        />
      )}
    </div>
  );
};
