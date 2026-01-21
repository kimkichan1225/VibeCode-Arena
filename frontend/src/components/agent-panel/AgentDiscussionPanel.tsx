import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, Monitor } from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { usePreviewStore } from '../../stores/previewStore';
import { PhaseIndicator } from './PhaseIndicator';
import { AgentMessage } from './AgentMessage';
import { ConsensusCard } from './ConsensusCard';
import { DiscussionView } from './DiscussionView';
import { PreviewPanel } from '../preview/PreviewPanel';

type TabType = 'discussion' | 'preview';

export const AgentDiscussionPanel: React.FC = () => {
  const { phase, messages, streamingMessages, consensusResult, discussion } = useAgentStore();
  const { code: previewCode } = usePreviewStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('discussion');

  // 자동 스크롤
  useEffect(() => {
    if (activeTab === 'discussion') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessages, discussion.reactions, activeTab]);

  // 미리보기 코드가 설정되면 자동으로 미리보기 탭으로 전환
  useEffect(() => {
    if (previewCode) {
      setActiveTab('preview');
    }
  }, [previewCode]);

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-700 bg-bg-tertiary">
        <button
          onClick={() => setActiveTab('discussion')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'discussion'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-bg-secondary'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          AI 토론
          {messages.length > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
              {messages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-bg-secondary'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Monitor className="w-4 h-4" />
          미리보기
          {previewCode && (
            <span className="w-2 h-2 bg-green-400 rounded-full" />
          )}
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'discussion' ? (
        <>
          {/* 단계 표시 */}
          <div className="p-4 border-b border-gray-800">
            <PhaseIndicator />
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && phase === 'idle' ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>AI 에이전트들의 토론이</p>
                  <p>여기에 표시됩니다</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <AgentMessage
                    key={message.id}
                    message={message}
                    streamingContent={streamingMessages.get(message.id)}
                  />
                ))}

                {/* 토론 뷰 */}
                <DiscussionView />

                {/* 합의 결과 */}
                {consensusResult && phase === 'complete' && (
                  <ConsensusCard result={consensusResult} />
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* 푸터 */}
          <div className="p-3 border-t border-gray-800 bg-bg-tertiary/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span>{messages.length}개 메시지</span>
                {discussion.reactions.length > 0 && (
                  <span className="text-purple-400">
                    {discussion.reactions.length}개 토론
                  </span>
                )}
              </div>
              {phase !== 'idle' && phase !== 'complete' && phase !== 'error' && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  {phase === 'discussion' ? '토론 중...' : '처리 중...'}
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <PreviewPanel />
      )}
    </div>
  );
};
