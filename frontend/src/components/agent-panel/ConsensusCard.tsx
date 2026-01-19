import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Star } from 'lucide-react';
import { ConsensusResult } from '../../types';
import { AGENT_CONFIGS } from '../../constants/agents';

interface ConsensusCardProps {
  result: ConsensusResult;
}

export const ConsensusCard: React.FC<ConsensusCardProps> = ({ result }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <h3 className="font-semibold text-white">합의 완료</h3>
      </div>

      {/* 바이브 점수 */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-bg-tertiary rounded-lg">
        <Star className="w-5 h-5 text-yellow-400" />
        <span className="text-sm text-gray-300">바이브 점수</span>
        <div className="flex-1 flex items-center gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-4 rounded-sm ${
                i < result.vibeScore ? 'bg-yellow-400' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
        <span className="text-lg font-bold text-yellow-400">
          {result.vibeScore}/10
        </span>
      </div>

      {/* 채택된 변경 */}
      {result.accepted.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-green-400 mb-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            채택된 변경 ({result.accepted.length}건)
          </p>
          <div className="space-y-1">
            {result.accepted.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-gray-300 bg-green-500/10 p-2 rounded"
              >
                <span className="text-green-400">✓</span>
                <span className="flex-1 truncate">{item.change.reason}</span>
                <span className="text-gray-500">
                  by {AGENT_CONFIGS[item.change.agent]?.name || item.change.agent}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 미채택 제안 */}
      {result.rejected.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            미채택 ({result.rejected.length}건)
          </p>
          <div className="space-y-1">
            {result.rejected.slice(0, 2).map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-gray-400 bg-gray-500/10 p-2 rounded"
              >
                <span className="text-gray-500">✗</span>
                <span className="flex-1 truncate">
                  {item.suggestion.description}
                </span>
                <span className="text-gray-600">{item.reason}</span>
              </div>
            ))}
            {result.rejected.length > 2 && (
              <p className="text-xs text-gray-500 pl-4">
                +{result.rejected.length - 2}개 더
              </p>
            )}
          </div>
        </div>
      )}

      {/* 요약 */}
      <p className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
        {result.summary}
      </p>
    </motion.div>
  );
};
