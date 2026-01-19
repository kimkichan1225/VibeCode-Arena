import React from 'react';
import { motion } from 'framer-motion';
import { AGENT_CONFIGS } from '../../constants/agents';
import { AgentMessage as AgentMessageType } from '../../types';
import { Badge } from '../common/Badge';

interface AgentMessageProps {
  message: AgentMessageType;
  streamingContent?: string;
}

export const AgentMessage: React.FC<AgentMessageProps> = ({
  message,
  streamingContent,
}) => {
  const agentConfig = AGENT_CONFIGS[message.agent];
  const displayContent = message.isStreaming
    ? streamingContent || ''
    : message.content;

  const getSeverityBadge = () => {
    const severity = message.metadata?.severity;
    if (!severity) return null;

    const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    };

    return <Badge variant={variants[severity] || 'info'}>{severity}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-3 rounded-lg agent-message-${message.agent}`}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{agentConfig.icon}</span>
        <span className={`font-medium ${agentConfig.color}`}>
          {agentConfig.name}
        </span>
        <Badge>{agentConfig.role}</Badge>
        {getSeverityBadge()}
        {message.metadata?.vibeScore !== undefined && (
          <Badge variant="warning">
            바이브 {message.metadata.vibeScore}/10
          </Badge>
        )}
      </div>

      {/* 내용 */}
      <div className="text-sm text-gray-300 whitespace-pre-wrap">
        {displayContent}
        {message.isStreaming && (
          <span className="inline-flex ml-1">
            <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full mx-0.5" />
            <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full mx-0.5" />
            <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full mx-0.5" />
          </span>
        )}
      </div>

      {/* 제안 사항 */}
      {message.suggestions && message.suggestions.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 mb-2">
            제안 ({message.suggestions.length}건)
          </p>
          <div className="space-y-1">
            {message.suggestions.slice(0, 3).map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-start gap-2 text-xs"
              >
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    suggestion.priority === 'high'
                      ? 'bg-red-500/20 text-red-400'
                      : suggestion.priority === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {suggestion.priority}
                </span>
                <span className="text-gray-400">{suggestion.description}</span>
              </div>
            ))}
            {message.suggestions.length > 3 && (
              <p className="text-xs text-gray-500">
                +{message.suggestions.length - 3}개 더...
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
