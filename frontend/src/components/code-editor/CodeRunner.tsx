import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Trash2, Terminal, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';

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
  // React 감지
  if (
    code.includes('import React') ||
    code.includes("from 'react'") ||
    code.includes('from "react"') ||
    code.includes('useState') ||
    code.includes('useEffect') ||
    code.includes('useCallback') ||
    /<[A-Z][a-zA-Z]*/.test(code) || // JSX 컴포넌트
    code.includes('React.FC') ||
    code.includes('React.Component')
  ) {
    return { isFramework: true, framework: 'React' };
  }

  // Vue 감지
  if (
    code.includes('import Vue') ||
    code.includes("from 'vue'") ||
    code.includes('<template>')
  ) {
    return { isFramework: true, framework: 'Vue' };
  }

  // Angular 감지
  if (
    code.includes('@Component') ||
    code.includes('@NgModule') ||
    code.includes("from '@angular")
  ) {
    return { isFramework: true, framework: 'Angular' };
  }

  // 일반 import/export 모듈 감지
  if (
    /^import\s+.+\s+from\s+['"]/.test(code) ||
    /^export\s+(default\s+)?/.test(code)
  ) {
    return { isFramework: true, framework: 'ES Module' };
  }

  return { isFramework: false, framework: '' };
};

export const CodeRunner: React.FC<CodeRunnerProps> = ({ code, language }) => {
  const [outputs, setOutputs] = useState<ConsoleOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'preview'>('console');
  const [showPreview, setShowPreview] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { isFramework, framework } = detectFrameworkCode(code);

  const clearOutput = useCallback(() => {
    setOutputs([]);
  }, []);

  const runCode = useCallback(() => {
    if (!code.trim() || isRunning) return;

    setIsRunning(true);
    setIsExpanded(true);
    clearOutput();

    // React 코드인 경우 미리보기 탭 활성화
    const isReact = isFramework && framework === 'React';
    if (isReact) {
      setShowPreview(true);
      setActiveTab('preview');
    } else {
      setShowPreview(false);
      setActiveTab('console');
    }

    // TypeScript를 JavaScript로 간단히 변환 (타입 제거)
    let executableCode = code;
    if (language === 'typescript') {
      executableCode = code
        .replace(/:\s*[\w<>\[\]|&\s,]+(\s*[=,\)\{])/g, '$1') // 타입 어노테이션 제거
        .replace(/interface\s+\w+\s*\{[\s\S]*?\n\}/g, '') // 인터페이스 제거
        .replace(/type\s+\w+\s*=[\s\S]*?;/g, '') // 타입 별칭 제거
        .replace(/<[\w\s,]+>(?=\()/g, '') // 제네릭 제거
        .replace(/\s+as\s+\w+/g, '') // 타입 단언 제거
        .replace(/public\s+|private\s+|protected\s+|readonly\s+/g, '') // 접근 제어자 제거
        .replace(/React\.FC\s*</g, '(') // React.FC 제거
        .replace(/:\s*React\.FC[^=]*/g, ' '); // React.FC 타입 제거
    }

    // React 코드인지 확인
    const isReactCode = isFramework && framework === 'React';

    // React 코드 전처리
    const processedReactCode = executableCode
      .replace(/import\s+React[^;]*;?/g, '')
      .replace(/import\s*{[^}]*}\s*from\s*['"]react['"]\s*;?/g, '')
      .replace(/export\s+default\s+/g, 'const __ExportedComponent__ = ')
      .replace(/<style\s+jsx>{`[\s\S]*?`}<\/style>/g, '') // styled-jsx 제거
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    // 컴포넌트 이름 찾기
    const componentMatch = executableCode.match(/(?:const|function)\s+([A-Z][a-zA-Z0-9]*)/);
    const componentName = componentMatch ? componentMatch[1] : 'App';

    // React용 HTML
    const reactHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; background: #1a1a2e; color: white; min-height: 100vh; }
            button { cursor: pointer; padding: 8px 16px; margin: 4px; border-radius: 4px; }
            h1 { margin-bottom: 16px; }
            .loading { display: flex; align-items: center; justify-content: center; height: 100vh; color: #888; }
          </style>
        </head>
        <body>
          <div id="root"><div class="loading">React 로딩 중...</div></div>

          <script>
            // 콘솔 출력 전송
            function sendOutput(type, args) {
              const content = args.map(arg => {
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg, null, 2); } catch (e) { return String(arg); }
                }
                return String(arg);
              }).join(' ');
              window.parent.postMessage({ type: 'console', outputType: type, content }, '*');
            }

            const originalConsole = { ...console };
            console.log = (...args) => { originalConsole.log(...args); sendOutput('log', args); };
            console.error = (...args) => { originalConsole.error(...args); sendOutput('error', args); };
            console.warn = (...args) => { originalConsole.warn(...args); sendOutput('warn', args); };

            window.onerror = (msg, src, line) => {
              sendOutput('error', [msg]);
              window.parent.postMessage({ type: 'done', success: false }, '*');
              return true;
            };
          </script>

          <!-- React & Babel CDN -->
          <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

          <script>
            // Babel 로드 대기 후 실행
            function waitForBabel() {
              if (typeof Babel !== 'undefined' && typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
                runReactCode();
              } else {
                setTimeout(waitForBabel, 100);
              }
            }

            function runReactCode() {
              try {
                const { useState, useEffect, useCallback, useRef, useMemo, useReducer, useContext, createContext, memo, forwardRef } = React;

                // Babel로 JSX 변환
                const code = \`
                  const { useState, useEffect, useCallback, useRef, useMemo, useReducer, useContext, createContext, memo, forwardRef } = React;
                  ${processedReactCode}

                  // 렌더링
                  const __ComponentToRender__ = typeof __ExportedComponent__ !== 'undefined' ? __ExportedComponent__ : (typeof ${componentName} !== 'undefined' ? ${componentName} : null);
                  if (__ComponentToRender__) {
                    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(__ComponentToRender__));
                    sendOutput('result', ['React 컴포넌트 렌더링 완료']);
                  } else {
                    sendOutput('warn', ['렌더링할 컴포넌트를 찾을 수 없습니다']);
                  }
                \`;

                const transformed = Babel.transform(code, { presets: ['react'] }).code;
                eval(transformed);

                window.parent.postMessage({ type: 'done', success: true }, '*');
              } catch (error) {
                sendOutput('error', [error.message]);
                document.getElementById('root').innerHTML = '<div style="color: #f87171; padding: 20px;"><h3>에러 발생</h3><pre>' + error.message + '</pre></div>';
                window.parent.postMessage({ type: 'done', success: false }, '*');
              }
            }

            // 시작
            waitForBabel();
          </script>
        </body>
      </html>
    `;

    // 일반 JavaScript용 HTML
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

    const html = isReactCode ? reactHtml : plainHtml;

    // 메시지 수신 핸들러
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console') {
        setOutputs(prev => [...prev, {
          type: event.data.outputType,
          content: event.data.content,
          timestamp: Date.now(),
        }]);
      } else if (event.data.type === 'done') {
        setIsRunning(false);
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);

    // iframe 생성 및 실행
    if (iframeRef.current) {
      const blob = new Blob([html], { type: 'text/html' });
      iframeRef.current.src = URL.createObjectURL(blob);
    }

    // 타임아웃 (React는 CDN 로드 때문에 15초, 일반 코드는 5초)
    const timeout = isReactCode ? 15000 : 5000;
    setTimeout(() => {
      if (isRunning) {
        setOutputs(prev => [...prev, {
          type: 'error',
          content: `실행 시간 초과 (${timeout / 1000}초)`,
          timestamp: Date.now(),
        }]);
        setIsRunning(false);
        window.removeEventListener('message', handleMessage);
      }
    }, timeout);
  }, [code, language, isRunning, clearOutput, isFramework, framework]);

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
                {isFramework && framework === 'React' ? 'React 실행' : '실행'}
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

      {/* 탭 (React 미리보기가 있는 경우) */}
      {isExpanded && showPreview && (
        <div className="flex border-b border-gray-700 bg-bg-secondary">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-sm ${
              activeTab === 'preview'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            미리보기
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`px-4 py-2 text-sm ${
              activeTab === 'console'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            콘솔 {outputs.length > 0 && `(${outputs.length})`}
          </button>
        </div>
      )}

      {/* 콘솔 출력 / 미리보기 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: showPreview ? 300 : 200 }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* 미리보기 탭 */}
            {showPreview && activeTab === 'preview' && (
              <div className="h-[300px] bg-[#1a1a2e]">
                <iframe
                  ref={iframeRef}
                  sandbox="allow-scripts"
                  className="w-full h-full border-0"
                  title="React Preview"
                />
              </div>
            )}

            {/* 콘솔 탭 */}
            {(!showPreview || activeTab === 'console') && (
              <div className={`${showPreview ? 'h-[300px]' : 'h-[200px]'} overflow-y-auto bg-bg-primary p-3 font-mono text-sm`}>
                {outputs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      {isFramework && framework !== 'React' ? (
                        <>
                          <p className="text-yellow-500">{framework} 코드는 브라우저에서 직접 실행할 수 없습니다</p>
                          <p className="text-xs mt-2 text-gray-500">
                            {framework === 'Vue' && '실제 프로젝트에서 npm run serve로 실행하세요'}
                            {framework === 'Angular' && '실제 프로젝트에서 ng serve로 실행하세요'}
                            {framework === 'ES Module' && '순수 JavaScript 코드만 실행 가능합니다'}
                          </p>
                        </>
                      ) : language === 'python' ? (
                        <p className="text-xs mt-1 text-yellow-500">
                          Python은 브라우저에서 실행할 수 없습니다
                        </p>
                      ) : isFramework && framework === 'React' ? (
                        <p>React 실행 버튼을 눌러 컴포넌트를 렌더링하세요</p>
                      ) : (
                        <p>코드를 실행하면 결과가 여기에 표시됩니다</p>
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
                        <pre className="whitespace-pre-wrap break-all flex-1">
                          {output.content}
                        </pre>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 일반 코드용 숨겨진 iframe */}
      {!showPreview && (
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          style={{ display: 'none' }}
          title="Code Runner"
        />
      )}
    </div>
  );
};
