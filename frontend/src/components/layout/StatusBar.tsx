import React from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { PHASE_LABELS } from '../../constants/agents';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { phase, consensusResult, error } = useAgentStore();
  const phaseInfo = PHASE_LABELS[phase] || PHASE_LABELS.idle;

  const getStatusIcon = () => {
    if (phase === 'complete') {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    if (phase === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
    if (phase !== 'idle') {
      return <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />;
    }
    return null;
  };

  return (
    <footer className="h-8 bg-bg-secondary border-t border-gray-800 flex items-center justify-between px-4 text-xs text-gray-400">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span>
            {phaseInfo.label}: {phaseInfo.description}
          </span>
        </div>

        {error && (
          <span className="text-red-400">
            오류: {error}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {consensusResult && (
          <>
            <span className="text-green-400">
              변경 {consensusResult.accepted.length}건 적용
            </span>
            <span>
              바이브 점수:{' '}
              <span className="text-yellow-400">
                {consensusResult.vibeScore}/10
              </span>
            </span>
          </>
        )}
      </div>
    </footer>
  );
};
