import React from 'react';
import { motion } from 'framer-motion';
import { useAgentStore } from '../../stores/agentStore';
import { Check, Loader2, Circle } from 'lucide-react';
import { Phase } from '../../types';

const PHASES: { key: Phase; label: string }[] = [
  { key: 'generation', label: '생성' },
  { key: 'review', label: '검토' },
  { key: 'discussion', label: '토론' },
  { key: 'consensus', label: '합의' },
  { key: 'merging', label: '적용' },
  { key: 'complete', label: '완료' },
];

export const PhaseIndicator: React.FC = () => {
  const { phase } = useAgentStore();

  const getPhaseIndex = (p: Phase): number => {
    const index = PHASES.findIndex((item) => item.key === p);
    return index >= 0 ? index : -1;
  };

  const currentIndex = getPhaseIndex(phase);

  const getPhaseStatus = (index: number): 'complete' | 'current' | 'pending' => {
    if (phase === 'idle' || phase === 'error') return 'pending';
    if (index < currentIndex) return 'complete';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="p-4 bg-bg-tertiary rounded-lg">
      <div className="flex items-center justify-between">
        {PHASES.map((item, index) => {
          const status = getPhaseStatus(index);

          return (
            <React.Fragment key={item.key}>
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: status === 'current' ? 1.1 : 1,
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    status === 'complete'
                      ? 'bg-green-500'
                      : status === 'current'
                      ? 'bg-purple-500'
                      : 'bg-gray-700'
                  }`}
                >
                  {status === 'complete' ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : status === 'current' ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Circle className="w-3 h-3 text-gray-500" />
                  )}
                </motion.div>
                <span
                  className={`text-xs mt-1 ${
                    status === 'current'
                      ? 'text-purple-400'
                      : status === 'complete'
                      ? 'text-green-400'
                      : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {index < PHASES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    getPhaseStatus(index) === 'complete'
                      ? 'bg-green-500'
                      : 'bg-gray-700'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
