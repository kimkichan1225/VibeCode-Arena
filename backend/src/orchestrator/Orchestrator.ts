import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { LLMService } from '../services/llm/LLMService';
import { ConsensusEngine } from './ConsensusEngine';
import { CodeMerger } from './CodeMerger';
import { VibeAgent } from '../agents/implementations/VibeAgent';
import { CodeReviewerAgent } from '../agents/implementations/CodeReviewerAgent';
import { BaseAgent } from '../agents/base/BaseAgent';
import {
  VibeRequest,
  AgentType,
  AgentOutput,
  AgentMessage,
  Phase,
  OrchestratorResult,
} from '../types';
import { config } from '../config';

export class Orchestrator extends EventEmitter {
  private llmService: LLMService;
  private agents: Map<AgentType, BaseAgent>;
  private consensusEngine: ConsensusEngine;
  private codeMerger: CodeMerger;

  constructor() {
    super();
    this.llmService = new LLMService();
    this.consensusEngine = new ConsensusEngine();
    this.codeMerger = new CodeMerger();

    // 에이전트 초기화 (최적화: 2개 에이전트만 사용)
    this.agents = new Map();
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // 최적화된 구조: Vibe Agent(생성) + CodeReviewer Agent(통합 검토)
    const vibeAgent = new VibeAgent(this.llmService);
    const reviewerAgent = new CodeReviewerAgent(this.llmService);

    this.agents.set('vibe', vibeAgent);
    this.agents.set('reviewer', reviewerAgent);

    // 에이전트 이벤트 리스닝
    for (const [type, agent] of this.agents) {
      agent.on('start', (data) => {
        this.emit('agent:start', { ...data, agent: type });
      });

      agent.on('chunk', (data) => {
        this.emit('agent:chunk', data);
      });

      agent.on('end', (data) => {
        this.emit('agent:end', { ...data, agent: type });
      });

      agent.on('error', (data) => {
        this.emit('agent:error', { ...data, agent: type });
      });
    }
  }

  async processRequest(request: VibeRequest): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const agentMessages: AgentMessage[] = [];
    let currentCode = '';
    const codeVersions: string[] = [];

    // 수정 모드 여부 확인
    const isModification = request.isModification && request.existingCode;

    try {
      // ===== Phase 1: 코드 생성/수정 =====
      if (isModification) {
        this.emitPhase('generation', 'Vibe Agent가 기존 코드를 수정하고 있습니다...');
      } else {
        this.emitPhase('generation', 'Vibe Agent가 코드를 생성하고 있습니다...');
      }

      const vibeAgent = this.agents.get('vibe') as VibeAgent;
      const vibeOutput = await vibeAgent.execute({
        sessionId: request.sessionId,
        originalRequest: request.prompt,
        currentCode: isModification ? request.existingCode! : '',
        tone: request.tone,
        language: request.language,
        isModification: !!isModification,
      });

      // 생성된 코드 추출
      currentCode = vibeOutput.metadata?.generatedCode || '';
      codeVersions.push(currentCode);

      // 코드 업데이트 이벤트
      this.emit('code:update', { code: currentCode, version: 1 });

      // 에이전트 메시지 기록
      agentMessages.push(this.createAgentMessage('vibe', vibeOutput));

      if (!currentCode) {
        throw new Error('코드 생성에 실패했습니다');
      }

      // ===== Phase 2: 통합 코드 리뷰 (최적화: 단일 에이전트) =====
      this.emitPhase('review', 'Code Reviewer가 코드를 종합 분석하고 있습니다...');

      const reviewerAgent = this.agents.get('reviewer') as CodeReviewerAgent;
      const reviewOutput = await reviewerAgent.execute({
        sessionId: request.sessionId,
        originalRequest: request.prompt,
        currentCode,
        tone: request.tone,
        language: request.language,
      });

      // 리뷰 결과 메시지 기록
      agentMessages.push(this.createAgentMessage('reviewer', reviewOutput));

      // ===== Phase 3: 합의 (단일 리뷰어이므로 간소화) =====
      this.emitPhase('consensus', '리뷰 결과를 정리하고 있습니다...');

      const consensusResult = this.consensusEngine.buildConsensus([reviewOutput]);

      this.emit('consensus:result', consensusResult);

      // ===== Phase 4: 코드 병합 =====
      this.emitPhase('merging', '개선 사항을 코드에 적용하고 있습니다...');

      let finalCode = currentCode;

      if (consensusResult.accepted.length > 0) {
        finalCode = this.codeMerger.merge(currentCode, consensusResult.accepted);

        // 코드 검증
        const validation = this.codeMerger.validateCode(finalCode, request.language);

        if (!validation.valid) {
          console.warn('코드 검증 실패, 원본 유지:', validation.errors);
          finalCode = currentCode;
        }
      }

      // 최종 코드가 원본과 다를 경우에만 버전 추가
      if (finalCode !== currentCode) {
        codeVersions.push(finalCode);
        this.emit('code:update', { code: finalCode, version: codeVersions.length });
      }

      // ===== Phase 5: 완료 =====
      this.emitPhase('complete', '모든 처리가 완료되었습니다!');

      const result: OrchestratorResult = {
        success: true,
        finalCode,
        codeVersions,
        consensus: consensusResult,
        agentMessages,
        metrics: {
          totalTime: Date.now() - startTime,
          discussionRounds: 0, // 토론 제거됨
          changesApplied: consensusResult.accepted.length,
          changesRejected: consensusResult.rejected.length,
          vibeScore: consensusResult.vibeScore,
        },
      };

      this.emit('process:complete', result);

      return result;
    } catch (error) {
      this.emitPhase('error', `오류 발생: ${(error as Error).message}`);
      throw error;
    }
  }

  private emitPhase(phase: Phase, message: string): void {
    this.emit('phase:change', { phase, message });
  }

  private createAgentMessage(agent: AgentType, output: AgentOutput): AgentMessage {
    return {
      id: uuidv4(),
      agent,
      content: output.analysis,
      timestamp: Date.now(),
      suggestions: output.suggestions,
      codeChanges: output.codeChanges,
      metadata: {
        vibeScore: output.metadata?.vibeScore,
        severity: output.metadata?.severity,
        confidence: output.metadata?.confidence,
      },
    };
  }
}
