import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Trash2, Terminal, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { usePreviewStore } from '../../stores/previewStore';

interface CodeRunnerProps {
  code: string;
  language: string;
}

interface ConsoleOutput {
  type: 'log' | 'error' | 'warn' | 'info' | 'result';
  content: string;
  timestamp: number;
}

// React/프레임워크 코드 감지
const detectFrameworkCode = (code: string): { isFramework: boolean; framework: string } => {
  if (
    code.includes('import React') ||
    code.includes("from 'react'") ||
    code.includes('from "react"') ||
    code.includes('useState') ||
    code.includes('useEffect') ||
    code.includes('useCallback') ||
    /<[A-Z][a-zA-Z]*/.test(code) ||
    code.includes('React.FC') ||
    code.includes('React.Component')
  ) {
    return { isFramework: true, framework: 'React' };
  }

  if (
    code.includes('import Vue') ||
    code.includes("from 'vue'") ||
    code.includes('<template>')
  ) {
    return { isFramework: true, framework: 'Vue' };
  }

  if (
    code.includes('@Component') ||
    code.includes('@NgModule') ||
    code.includes("from '@angular")
  ) {
    return { isFramework: true, framework: 'Angular' };
  }

  return { isFramework: false, framework: '' };
};

export const CodeRunner: React.FC<CodeRunnerProps> = ({ code, language }) => {
  const [outputs, setOutputs] = useState<ConsoleOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const plainIframeRef = useRef<HTMLIFrameElement>(null);
  const isRunningRef = useRef(false);

  const { setPreviewCode, setIsRunning: setPreviewRunning } = usePreviewStore();

  const { isFramework, framework } = detectFrameworkCode(code);
  const isReactCode = isFramework && framework === 'React';

  // 콘솔 메시지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'console') {
        setOutputs(prev => [...prev, {
          type: event.data.outputType,
          content: event.data.content,
          timestamp: Date.now(),
        }]);
      } else if (event.data.type === 'done') {
        setIsRunning(false);
        isRunningRef.current = false;
        setPreviewRunning(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setPreviewRunning]);

  const clearOutput = useCallback(() => {
    setOutputs([]);
  }, []);

  // React 코드 전처리 (import/export만 처리, 타입은 Babel이 처리)
  const processReactCode = (jsCode: string): string => {
    return jsCode
      .replace(/import\s+React[^;]*;?\n?/g, '')
      .replace(/import\s*\{[^}]*\}\s*from\s*['"]react['"]\s*;?\n?/g, '')
      .replace(/import\s+.*\s+from\s+['"][^'"]+['"]\s*;?\n?/g, '')
      .replace(/export\s+default\s+/g, 'const __ExportedComponent__ = ')
      .replace(/export\s+\{[^}]*\}\s*;?\n?/g, '')
      .replace(/export\s+(?=const|let|var|function|class|interface|type)/g, '')
      .replace(/<style\s+jsx>\s*\{`[\s\S]*?`\}\s*<\/style>/g, '');
  };

  // 컴포넌트 이름 찾기
  const findComponentName = (jsCode: string): string => {
    const match = jsCode.match(/(?:const|function)\s+([A-Z][a-zA-Z0-9]*)/);
    return match ? match[1] : 'App';
  };

  const runReactCode = useCallback(() => {
    if (!code.trim() || isRunning) return;

    setIsRunning(true);
    isRunningRef.current = true;
    setPreviewRunning(true);
    clearOutput();

    const processedCode = processReactCode(code);
    const componentName = findComponentName(code);
    const isTypeScript = language === 'typescript';

    // previewStore에 코드 설정 → PreviewPanel에서 실행
    setPreviewCode(processedCode, componentName, isTypeScript);

    // 타임아웃
    setTimeout(() => {
      if (isRunningRef.current) {
        setOutputs(prev => [...prev, {
          type: 'error',
          content: '실행 시간 초과 (10초)',
          timestamp: Date.now(),
        }]);
        setIsRunning(false);
        isRunningRef.current = false;
        setPreviewRunning(false);
      }
    }, 10000);
  }, [code, language, isRunning, clearOutput, setPreviewCode, setPreviewRunning]);

  // TypeScript를 JavaScript로 변환 (일반 코드용)
  const convertTypeScript = (tsCode: string): string => {
    return tsCode
      .replace(/:\s*[\w<>\[\]|&\s,]+(\s*[=,\)\{])/g, '$1')
      .replace(/interface\s+\w+\s*\{[^}]*\}/gs, '')
      .replace(/type\s+\w+\s*=[^;]+;/g, '')
      .replace(/\s+as\s+\w+/g, '')
      .replace(/\b(public|private|protected|readonly)\s+/g, '');
  };

  const runPlainCode = useCallback(() => {
    if (!code.trim() || isRunning) return;

    setIsRunning(true);
    isRunningRef.current = true;
    clearOutput();

    const executableCode = language === 'typescript' ? convertTypeScript(code) : code;

    const plainHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            function sendOutput(type, args) {
              const content = args.map(arg => {
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg, null, 2); } catch (e) { return String(arg); }
                }
                return String(arg);
              }).join(' ');
              window.parent.postMessage({ type: 'console', outputType: type, content }, '*');
            }
            console.log = (...args) => sendOutput('log', args);
            console.error = (...args) => sendOutput('error', args);
            console.warn = (...args) => sendOutput('warn', args);
            console.info = (...args) => sendOutput('info', args);
            window.onerror = (msg, src, line) => { sendOutput('error', [msg + ' (Line: ' + line + ')']); return true; };
            window.onunhandledrejection = (e) => { sendOutput('error', ['Unhandled Promise: ' + e.reason]); };
          </script>
        </head>
        <body>
          <script>
            try {
              const result = eval(\`${executableCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
              if (result !== undefined) {
                window.parent.postMessage({
                  type: 'console', outputType: 'result',
                  content: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
                }, '*');
              }
              window.parent.postMessage({ type: 'done', success: true }, '*');
            } catch (error) {
              window.parent.postMessage({ type: 'console', outputType: 'error', content: error.message }, '*');
              window.parent.postMessage({ type: 'done', success: false }, '*');
            }
          </script>
        </body>
      </html>
    `;

    if (plainIframeRef.current) {
      const blob = new Blob([plainHtml], { type: 'text/html' });
      plainIframeRef.current.src = URL.createObjectURL(blob);
    }

    setTimeout(() => {
      if (isRunningRef.current) {
        setOutputs(prev => [...prev, {
          type: 'error',
          content: '실행 시간 초과 (5초)',
          timestamp: Date.now(),
        }]);
        setIsRunning(false);
        isRunningRef.current = false;
      }
    }, 5000);
  }, [code, language, isRunning, clearOutput]);

  const runCode = useCallback(() => {
    if (isReactCode) {
      runReactCode();
    } else {
      runPlainCode();
    }
  }, [isReactCode, runReactCode, runPlainCode]);

  const getOutputIcon = (type: ConsoleOutput['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      case 'warn':
        return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case 'result':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      default:
        return <Terminal className="w-3 h-3 text-gray-400" />;
    }
  };

  const getOutputColor = (type: ConsoleOutput['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'result':
        return 'text-green-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="border-t border-gray-800">
      {/* 툴바 */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">콘솔</span>
          {outputs.length > 0 && (
            <span className="text-xs text-gray-500">({outputs.length})</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearOutput}
            disabled={outputs.length === 0}
          >
            <Trash2 className="w-3 h-3" />
          </Button>

          <Button
            variant={isRunning ? 'secondary' : 'primary'}
            size="sm"
            onClick={runCode}
            disabled={!code.trim() || language === 'python' || (isFramework && framework !== 'React')}
            isLoading={isRunning}
          >
            {isRunning ? (
              <>
                <Square className="w-3 h-3 mr-1" />
                실행 중
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                {isReactCode ? 'React 실행' : '실행'}
              </>
            )}
          </Button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-400 hover:text-white"
          >
            {isExpanded ? '접기' : '펼치기'}
          </button>
        </div>
      </div>

      {/* 콘솔 출력 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 150 }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="h-[150px] overflow-y-auto bg-bg-primary p-3 font-mono text-sm">
              {outputs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {isFramework && framework !== 'React' ? (
                      <>
                        <p className="text-yellow-500 text-xs">{framework} 코드는 브라우저에서 직접 실행할 수 없습니다</p>
                      </>
                    ) : language === 'python' ? (
                      <p className="text-xs text-yellow-500">
                        Python은 브라우저에서 실행할 수 없습니다
                      </p>
                    ) : (
                      <p className="text-xs">코드를 실행하면 결과가 여기에 표시됩니다</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {outputs.map((output, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-start gap-2 ${getOutputColor(output.type)}`}
                    >
                      {getOutputIcon(output.type)}
                      <pre className="whitespace-pre-wrap break-all flex-1 text-xs">
                        {output.content}
                      </pre>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 일반 코드용 숨겨진 iframe */}
      {!isReactCode && (
        <iframe
          ref={plainIframeRef}
          sandbox="allow-scripts"
          style={{ display: 'none' }}
          title="Code Runner"
        />
      )}
    </div>
  );
};
