import React, { useRef, useEffect, useCallback } from 'react';
import { RotateCcw, Monitor } from 'lucide-react';
import { usePreviewStore } from '../../stores/previewStore';
import { Button } from '../common/Button';

export const PreviewPanel: React.FC = () => {
  const { code, componentName, isTypeScript, isRunning, iframeKey, setIsRunning, reloadPreview } =
    usePreviewStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pendingCodeRef = useRef<{ code: string; componentName: string; isTypeScript: boolean } | null>(null);

  // iframe 메시지 핸들러
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'ready') {
        // iframe이 준비되면 대기 중인 코드 실행
        if (pendingCodeRef.current && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'execute',
            code: pendingCodeRef.current.code,
            componentName: pendingCodeRef.current.componentName,
            isTypeScript: pendingCodeRef.current.isTypeScript,
          }, '*');
          pendingCodeRef.current = null;
        }
      } else if (event.data.type === 'done') {
        setIsRunning(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setIsRunning]);

  // 코드가 변경되면 실행
  useEffect(() => {
    if (code && iframeKey > 0) {
      pendingCodeRef.current = { code, componentName, isTypeScript };
    }
  }, [code, componentName, isTypeScript, iframeKey]);

  const handleReload = useCallback(() => {
    if (code) {
      pendingCodeRef.current = { code, componentName, isTypeScript };
      reloadPreview();
    }
  }, [code, componentName, isTypeScript, reloadPreview]);

  const hasPreview = code.trim().length > 0;

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      {/* 툴바 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-bg-tertiary">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-300">React 미리보기</span>
          {isRunning && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded animate-pulse">
              실행 중...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReload}
            disabled={!hasPreview}
            title="새로고침"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 미리보기 영역 */}
      <div className="flex-1 bg-[#1a1a2e]">
        {hasPreview ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src="/react-runner.html"
            className="w-full h-full border-0"
            title="React Preview"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Monitor className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">미리보기 대기 중</p>
              <p className="text-sm mt-2 text-gray-600">
                React 코드를 실행하면 여기에 표시됩니다
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
