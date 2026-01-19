import React, { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { PhaseIndicator } from './PhaseIndicator';
import { AgentMessage } from './AgentMessage';
import { ConsensusCard } from './ConsensusCard';
import { DiscussionView } from './DiscussionView';

export const AgentDiscussionPanel: React.FC = () => {
  const { phase, messages, streamingMessages, consensusResult, discussion } = useAgentStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessages, discussion.reactions]);

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">AI 토론</h2>
        </div>

        {/* 단계 표시 */}
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
    </div>
  );
};
