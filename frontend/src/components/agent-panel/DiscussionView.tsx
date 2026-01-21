import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ArrowRight, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { AGENT_CONFIGS } from '../../constants/agents';
import { AgentReaction, ReactionType } from '../../types';

const REACTION_ICONS: Record<ReactionType, React.ReactNode> = {
  agree: <CheckCircle className="w-4 h-4 text-green-400" />,
  disagree: <XCircle className="w-4 h-4 text-red-400" />,
  partial: <AlertCircle className="w-4 h-4 text-yellow-400" />,
  counter: <Zap className="w-4 h-4 text-purple-400" />,
};

const REACTION_LABELS: Record<ReactionType, string> = {
  agree: '동의',
  disagree: '반대',
  partial: '부분 동의',
  counter: '대안 제시',
};

const REACTION_COLORS: Record<ReactionType, string> = {
  agree: 'bg-green-500/20 border-green-500/50',
  disagree: 'bg-red-500/20 border-red-500/50',
  partial: 'bg-yellow-500/20 border-yellow-500/50',
  counter: 'bg-purple-500/20 border-purple-500/50',
};

interface ReactionCardProps {
  reaction: AgentReaction;
  index: number;
}

// content를 안전하게 문자열로 변환
const formatContent = (content: any): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (content && typeof content === 'object') {
    // {code, explanation} 형태인 경우
    if (content.explanation) {
      return content.explanation;
    }
    if (content.code) {
      return content.code;
    }
    // 그 외 객체는 JSON으로 변환
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  }
  return String(content || '');
};

const ReactionCard: React.FC<ReactionCardProps> = ({ reaction, index }) => {
  const fromAgent = AGENT_CONFIGS[reaction.from];
  const toAgent = AGENT_CONFIGS[reaction.to];

  const displayContent = formatContent(reaction.content);
  const displayAlternative = reaction.alternative ? formatContent(reaction.alternative) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`p-3 rounded-lg border ${REACTION_COLORS[reaction.type]}`}
    >
      {/* 헤더: 누가 누구에게 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{fromAgent.icon}</span>
        <span className={`font-medium text-sm ${fromAgent.color}`}>
          {fromAgent.nameKo}
        </span>
        <ArrowRight className="w-4 h-4 text-gray-500" />
        <span className="text-lg">{toAgent.icon}</span>
        <span className={`font-medium text-sm ${toAgent.color}`}>
          {toAgent.nameKo}
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-tertiary">
          {REACTION_ICONS[reaction.type]}
          <span className="text-xs text-gray-300">{REACTION_LABELS[reaction.type]}</span>
        </div>
      </div>

      {/* 내용 */}
      <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
        {displayContent}
      </div>

      {/* 대안이 있는 경우 */}
      {displayAlternative && (
        <div className="mt-2 p-2 bg-bg-tertiary/50 rounded border border-gray-700">
          <p className="text-xs text-purple-400 mb-1">대안 제안:</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{displayAlternative}</p>
        </div>
      )}
    </motion.div>
  );
};

export const DiscussionView: React.FC = () => {
  const { discussion, phase } = useAgentStore();
  const { isActive, currentRound, totalConflicts, resolvedConflicts, reactions, rounds } = discussion;

  // 토론이 없는 경우
  if (!isActive && reactions.length === 0 && phase !== 'discussion') {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 토론 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-white">에이전트 토론</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {isActive && (
              <span className="flex items-center gap-1 text-purple-300">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                라운드 {currentRound}
              </span>
            )}
            <span className="text-gray-400">
              충돌: {resolvedConflicts}/{totalConflicts} 해결
            </span>
          </div>
        </div>

        {/* 진행 바 */}
        {totalConflicts > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${(resolvedConflicts / totalConflicts) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* 라운드별 토론 내용 */}
      <AnimatePresence>
        {rounds.map((round) => (
          <motion.div
            key={`round-${round.round}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {/* 라운드 구분선 */}
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-xs text-gray-500 px-2 bg-bg-secondary">
                라운드 {round.round} ({round.resolvedCount}개 해결)
              </span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            {/* 해당 라운드의 반응들 */}
            <div className="space-y-2 pl-2 border-l-2 border-purple-500/30">
              {round.reactions.map((reaction, idx) => (
                <ReactionCard
                  key={`${round.round}-${idx}`}
                  reaction={reaction}
                  index={idx}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 현재 진행 중인 반응들 (아직 라운드에 포함되지 않은 것들) */}
      {isActive && (
        <AnimatePresence>
          {reactions
            .filter((r) => !rounds.some((rd) => rd.reactions.includes(r)))
            .map((reaction, idx) => (
              <ReactionCard
                key={`current-${idx}`}
                reaction={reaction}
                index={idx}
              />
            ))}
        </AnimatePresence>
      )}

      {/* 토론 중 표시 */}
      {isActive && phase === 'discussion' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 p-4 text-gray-400"
        >
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">에이전트들이 토론 중...</span>
        </motion.div>
      )}

      {/* 토론 완료 */}
      {!isActive && reactions.length > 0 && phase !== 'discussion' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm text-green-300">
            토론 완료 - {resolvedConflicts}개 충돌 해결
          </span>
        </motion.div>
      )}
    </div>
  );
};
