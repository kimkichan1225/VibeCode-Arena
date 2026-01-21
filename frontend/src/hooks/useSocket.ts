import { useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { useAgentStore } from '../stores/agentStore';
import { useCodeStore } from '../stores/codeStore';
import { useVibeStore } from '../stores/vibeStore';
import { useHistoryStore } from '../stores/historyStore';
import { useProjectStore } from '../stores/projectStore';
import { AgentType, Phase, AgentReaction, ProjectFile, ProjectResult, VibeTone } from '../types';

export function useSocket() {
  const {
    setSessionId,
    setPhase,
    addMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    setConsensusResult,
    setError,
    startDiscussionRound,
    addDiscussionReaction,
    endDiscussionRound,
    resetDiscussion,
    reset: resetAgentStore,
  } = useAgentStore();

  const { setCode, addVersion, reset: resetCodeStore } = useCodeStore();
  const { setIsProcessing } = useVibeStore();
  const { addToHistory } = useHistoryStore();
  const {
    addFile,
    setFiles,
    setResult,
    setIsGenerating,
    setError: setProjectError,
  } = useProjectStore();

  useEffect(() => {
    const socket = socketService.connect();

    // 세션 초기화
    socket.on('session:init', ({ sessionId }: { sessionId: string }) => {
      setSessionId(sessionId);
    });

    // 단계 변경
    socket.on('phase:change', ({ phase }: { phase: Phase }) => {
      setPhase(phase);

      if (phase === 'complete' || phase === 'error') {
        setIsProcessing(false);
      }
    });

    // 에이전트 메시지 시작
    socket.on(
      'agent:message:start',
      ({ agent, messageId }: { agent: AgentType; messageId: string }) => {
        addMessage({
          id: messageId,
          agent,
          content: '',
          timestamp: Date.now(),
          isStreaming: true,
        });
      }
    );

    // 에이전트 메시지 스트리밍
    socket.on('agent:message:chunk', ({ messageId, chunk }: { messageId: string; chunk: string }) => {
      updateStreamingMessage(messageId, chunk);
    });

    // 에이전트 메시지 완료
    socket.on(
      'agent:message:end',
      ({
        messageId,
        content,
        metadata,
      }: {
        messageId: string;
        content: string;
        metadata?: any;
      }) => {
        finalizeStreamingMessage(messageId, content, metadata);
      }
    );

    // 코드 업데이트
    socket.on('code:update', ({ code }: { code: string }) => {
      setCode(code);
      addVersion(code);
    });

    // 합의 결과
    socket.on('consensus:result', (result: any) => {
      setConsensusResult(result);
    });

    // 토론 라운드 시작
    socket.on('discussion:round:start', ({ round, conflictCount }: { round: number; conflictCount: number }) => {
      startDiscussionRound(round, conflictCount);
    });

    // 토론 반응
    socket.on('discussion:reaction', ({ reaction }: { reaction: AgentReaction }) => {
      addDiscussionReaction(reaction);
    });

    // 토론 라운드 종료
    socket.on('discussion:round:end', ({ round, resolvedCount }: { round: number; resolvedCount: number }) => {
      endDiscussionRound(round, resolvedCount);
    });

    // 처리 완료
    socket.on('process:complete', (result: any) => {
      setPhase('complete');
      setIsProcessing(false);

      // 히스토리에 저장
      const { prompt, tone, language } = useVibeStore.getState();
      const { messages, consensusResult } = useAgentStore.getState();
      const { versions } = useCodeStore.getState();

      if (result.finalCode && prompt) {
        addToHistory({
          prompt,
          tone,
          language,
          codeVersions: versions,
          finalCode: result.finalCode,
          vibeScore: result.metrics?.vibeScore || consensusResult?.vibeScore || 7,
          changesApplied: result.metrics?.changesApplied || 0,
          agentMessages: messages,
          consensus: consensusResult || undefined,
        });
      }
    });

    // 에러
    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
      setPhase('error');
      setIsProcessing(false);
      setIsGenerating(false);
      setProjectError(message);
    });

    // 프로젝트 파일 생성 완료
    socket.on('project:file:end', ({ file }: { file: ProjectFile }) => {
      addFile(file);
    });

    // 프로젝트 완료
    socket.on('project:complete', (result: ProjectResult) => {
      setPhase('complete');
      setIsGenerating(false);
      setResult(result);
      setFiles(result.files);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const sendVibeRequest = useCallback(
    (promptText: string, toneValue: string, languageValue: string, existingCode?: string, isModification?: boolean) => {
      setIsProcessing(true);
      setPhase('generation');
      setError(null);

      // 이전 상태 초기화
      resetAgentStore();
      resetCodeStore();
      resetDiscussion();

      // 요청 전송
      socketService.emit('vibe:request', {
        prompt: promptText,
        tone: toneValue,
        language: languageValue,
        existingCode: existingCode || undefined,
        isModification: isModification || false,
      });
    },
    [setIsProcessing, setPhase, setError, resetAgentStore, resetCodeStore, resetDiscussion]
  );

  // 프로젝트 요청 전송
  const sendProjectRequest = useCallback(
    (config: {
      prompt: string;
      projectName: string;
      basePath: string;
      tone: VibeTone;
      language: string;
      framework: 'react' | 'vue' | 'svelte' | 'vanilla';
      includeTests: boolean;
      includeStyles: boolean;
      selectedFiles: string[];
    }) => {
      setIsGenerating(true);
      setPhase('generation');
      setError(null);
      setProjectError(null);
      setFiles([]);
      setResult(null);

      // 이전 상태 초기화
      resetAgentStore();

      // 요청 전송
      socketService.emit('project:request', {
        prompt: config.prompt,
        projectName: config.projectName,
        basePath: config.basePath,
        tone: config.tone,
        language: config.language,
        mode: 'project',
        framework: config.framework,
        includeTests: config.includeTests,
        includeStyles: config.includeStyles,
      });
    },
    [setIsGenerating, setPhase, setError, setProjectError, setFiles, setResult, resetAgentStore]
  );

  return {
    isConnected: socketService.isConnected(),
    sendVibeRequest,
    sendProjectRequest,
  };
}
