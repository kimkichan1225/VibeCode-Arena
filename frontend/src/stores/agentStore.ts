import { create } from 'zustand';
import { AgentMessage, AgentType, ConsensusResult, Phase, AgentReaction, DiscussionState } from '../types';

interface AgentState {
  sessionId: string | null;
  phase: Phase;
  messages: AgentMessage[];
  streamingMessages: Map<string, string>;
  consensusResult: ConsensusResult | null;
  error: string | null;

  // 토론 상태
  discussion: DiscussionState;

  setSessionId: (sessionId: string) => void;
  setPhase: (phase: Phase) => void;
  addMessage: (message: AgentMessage) => void;
  updateStreamingMessage: (messageId: string, chunk: string) => void;
  finalizeStreamingMessage: (messageId: string, content: string, metadata?: any) => void;
  setConsensusResult: (result: ConsensusResult) => void;
  setError: (error: string | null) => void;

  // 토론 관련 액션
  startDiscussionRound: (round: number, conflictCount: number) => void;
  addDiscussionReaction: (reaction: AgentReaction) => void;
  endDiscussionRound: (round: number, resolvedCount: number) => void;
  resetDiscussion: () => void;

  reset: () => void;
}

const initialDiscussionState: DiscussionState = {
  isActive: false,
  currentRound: 0,
  totalConflicts: 0,
  resolvedConflicts: 0,
  rounds: [],
  reactions: [],
};

export const useAgentStore = create<AgentState>((set) => ({
  sessionId: null,
  phase: 'idle',
  messages: [],
  streamingMessages: new Map(),
  consensusResult: null,
  error: null,
  discussion: initialDiscussionState,

  setSessionId: (sessionId) => set({ sessionId }),

  setPhase: (phase) => set({ phase }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateStreamingMessage: (messageId, chunk) =>
    set((state) => {
      const newMap = new Map(state.streamingMessages);
      const current = newMap.get(messageId) || '';
      newMap.set(messageId, current + chunk);
      return { streamingMessages: newMap };
    }),

  finalizeStreamingMessage: (messageId, content, metadata) =>
    set((state) => {
      const newMap = new Map(state.streamingMessages);
      newMap.delete(messageId);

      // 스트리밍 중인 메시지를 완료된 메시지로 업데이트
      const updatedMessages = state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, content, isStreaming: false, metadata: { ...msg.metadata, ...metadata } }
          : msg
      );

      return {
        streamingMessages: newMap,
        messages: updatedMessages,
      };
    }),

  setConsensusResult: (result) => set({ consensusResult: result }),

  setError: (error) => set({ error }),

  // 토론 라운드 시작
  startDiscussionRound: (round, conflictCount) =>
    set((state) => ({
      discussion: {
        ...state.discussion,
        isActive: true,
        currentRound: round,
        totalConflicts: conflictCount,
      },
    })),

  // 토론 반응 추가
  addDiscussionReaction: (reaction) =>
    set((state) => ({
      discussion: {
        ...state.discussion,
        reactions: [...state.discussion.reactions, { ...reaction, timestamp: Date.now() }],
      },
    })),

  // 토론 라운드 종료
  endDiscussionRound: (round, resolvedCount) =>
    set((state) => {
      const currentRoundReactions = state.discussion.reactions.filter(
        (r) => !state.discussion.rounds.some((rd) => rd.reactions.includes(r))
      );

      const newRound = {
        round,
        reactions: currentRoundReactions,
        conflictCount: state.discussion.totalConflicts,
        resolvedCount,
        timestamp: Date.now(),
      };

      return {
        discussion: {
          ...state.discussion,
          rounds: [...state.discussion.rounds, newRound],
          resolvedConflicts: resolvedCount,
          isActive: state.discussion.totalConflicts > resolvedCount,
        },
      };
    }),

  // 토론 상태 리셋
  resetDiscussion: () =>
    set({
      discussion: initialDiscussionState,
    }),

  reset: () =>
    set({
      sessionId: null,
      phase: 'idle',
      messages: [],
      streamingMessages: new Map(),
      consensusResult: null,
      error: null,
      discussion: initialDiscussionState,
    }),
}));
