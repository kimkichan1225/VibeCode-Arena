import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentType,
  AgentOutput,
  Suggestion,
  AgentReaction,
} from '../types';
import { LLMService } from '../services/llm/LLMService';
import { getReactionPrompt } from '../agents/prompts';
import { config } from '../config';

interface Conflict {
  id: string;
  agentA: AgentType;
  agentB: AgentType;
  suggestionA: Suggestion;
  suggestionB: Suggestion;
  type: 'code_overlap' | 'philosophy_conflict';
  resolved: boolean;
}

interface DiscussionRound {
  round: number;
  reactions: AgentReaction[];
  conflicts: Conflict[];
  timestamp: number;
}

export class DiscussionManager extends EventEmitter {
  private llmService: LLMService;
  private history: Map<string, DiscussionRound[]> = new Map();
  private maxRounds: number;

  constructor(llmService: LLMService) {
    super();
    this.llmService = llmService;
    this.maxRounds = config.orchestrator.maxDiscussionRounds;
  }

  // 충돌 감지
  detectConflicts(outputs: AgentOutput[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const allSuggestions: { agent: AgentType; suggestion: Suggestion }[] = [];

    // 모든 제안 수집
    for (const output of outputs) {
      for (const suggestion of output.suggestions) {
        allSuggestions.push({ agent: output.agent, suggestion });
      }
    }

    // 충돌 검사
    for (let i = 0; i < allSuggestions.length; i++) {
      for (let j = i + 1; j < allSuggestions.length; j++) {
        const a = allSuggestions[i];
        const b = allSuggestions[j];

        // 같은 에이전트의 제안은 건너뜀
        if (a.agent === b.agent) continue;

        // 코드 영역 충돌 검사
        if (this.checkLineOverlap(a.suggestion, b.suggestion)) {
          conflicts.push({
            id: uuidv4(),
            agentA: a.agent,
            agentB: b.agent,
            suggestionA: a.suggestion,
            suggestionB: b.suggestion,
            type: 'code_overlap',
            resolved: false,
          });
        }

        // 철학적 충돌 검사 (성능 vs 가독성)
        if (this.checkPhilosophyConflict(a.suggestion, b.suggestion)) {
          conflicts.push({
            id: uuidv4(),
            agentA: a.agent,
            agentB: b.agent,
            suggestionA: a.suggestion,
            suggestionB: b.suggestion,
            type: 'philosophy_conflict',
            resolved: false,
          });
        }
      }
    }

    return conflicts;
  }

  // 토론 라운드 실행
  async runDiscussion(
    sessionId: string,
    conflicts: Conflict[],
    outputs: AgentOutput[],
    currentCode: string
  ): Promise<{ reactions: AgentReaction[]; resolvedConflicts: Conflict[] }> {
    const allReactions: AgentReaction[] = [];
    const rounds: DiscussionRound[] = [];
    let remainingConflicts = [...conflicts];
    let round = 0;

    while (remainingConflicts.length > 0 && round < this.maxRounds) {
      round++;
      const roundReactions: AgentReaction[] = [];

      this.emit('discussion:round:start', { sessionId, round, conflictCount: remainingConflicts.length });

      for (const conflict of remainingConflicts) {
        if (conflict.resolved) continue;

        // Agent A가 Agent B의 의견에 반응
        const reactionA = await this.generateReaction(
          conflict.agentA,
          conflict.agentB,
          conflict.suggestionB,
          conflict.suggestionA,
          this.getDiscussionHistory(sessionId)
        );

        roundReactions.push(reactionA);
        this.emit('discussion:reaction', { sessionId, reaction: reactionA });

        // Agent B가 Agent A의 반응에 응답
        const reactionB = await this.generateReaction(
          conflict.agentB,
          conflict.agentA,
          conflict.suggestionA,
          conflict.suggestionB,
          this.getDiscussionHistory(sessionId) + `\n${reactionA.content}`
        );

        roundReactions.push(reactionB);
        this.emit('discussion:reaction', { sessionId, reaction: reactionB });

        // 합의 도달 여부 확인
        if (reactionA.type === 'agree' || reactionB.type === 'agree') {
          conflict.resolved = true;
        } else if (reactionA.type === 'partial' && reactionB.type === 'partial') {
          conflict.resolved = true;
        }
      }

      // 라운드 기록
      rounds.push({
        round,
        reactions: roundReactions,
        conflicts: remainingConflicts.map(c => ({ ...c })),
        timestamp: Date.now(),
      });

      allReactions.push(...roundReactions);
      remainingConflicts = remainingConflicts.filter(c => !c.resolved);

      this.emit('discussion:round:end', {
        sessionId,
        round,
        resolvedCount: conflicts.length - remainingConflicts.length
      });
    }

    // 히스토리 저장
    this.history.set(sessionId, rounds);

    return {
      reactions: allReactions,
      resolvedConflicts: conflicts.filter(c => c.resolved),
    };
  }

  // 에이전트 반응 생성
  private async generateReaction(
    fromAgent: AgentType,
    toAgent: AgentType,
    targetSuggestion: Suggestion,
    myPosition: Suggestion,
    discussionHistory: string
  ): Promise<AgentReaction> {
    const agentNames: Record<AgentType, string> = {
      vibe: 'Vibe Agent',
      reviewer: 'Code Reviewer',
      validator: 'Validator Agent',
      optimizer: 'Optimizer Agent',
      security: 'Security Agent',
      ux: 'UX Agent',
    };

    const prompt = getReactionPrompt(
      agentNames[fromAgent],
      agentNames[toAgent],
      JSON.stringify(targetSuggestion, null, 2),
      JSON.stringify(myPosition, null, 2),
      discussionHistory
    );

    try {
      const response = await this.llmService.completion({
        systemPrompt: `당신은 ${agentNames[fromAgent]}입니다. 코드 리뷰 토론에서 다른 에이전트의 의견에 반응합니다. 반드시 한국어로 응답하세요.`,
        userPrompt: prompt,
        temperature: 0.4,
        maxTokens: 1000,
      });

      const parsed = this.parseReactionResponse(response);

      return {
        from: fromAgent,
        to: toAgent,
        type: parsed.reaction as 'agree' | 'disagree' | 'partial' | 'counter',
        content: parsed.reasoning,
        alternative: parsed.alternative,
      };
    } catch (error) {
      console.error('Failed to generate reaction:', error);
      return {
        from: fromAgent,
        to: toAgent,
        type: 'partial',
        content: '기술적 검토 후 부분적으로 동의합니다.',
      };
    }
  }

  private parseReactionResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse reaction:', e);
    }
    return {
      reaction: 'partial',
      reasoning: response,
      compromise: null,
      alternative: null,
    };
  }

  private checkLineOverlap(a: Suggestion, b: Suggestion): boolean {
    if (!a.targetLines || !b.targetLines) return false;

    const aStart = a.targetLines.start;
    const aEnd = a.targetLines.end;
    const bStart = b.targetLines.start;
    const bEnd = b.targetLines.end;

    return !(aEnd < bStart || bEnd < aStart);
  }

  private checkPhilosophyConflict(a: Suggestion, b: Suggestion): boolean {
    const performanceTypes = ['performance', 'refactoring'];
    const readabilityTypes = ['readability', 'naming', 'style'];

    const aIsPerformance = performanceTypes.includes(a.type);
    const bIsReadability = readabilityTypes.includes(b.type);
    const aIsReadability = readabilityTypes.includes(a.type);
    const bIsPerformance = performanceTypes.includes(b.type);

    return (aIsPerformance && bIsReadability) || (aIsReadability && bIsPerformance);
  }

  private getDiscussionHistory(sessionId: string): string {
    const rounds = this.history.get(sessionId) || [];
    if (rounds.length === 0) return '이전 토론 없음';

    return rounds
      .flatMap(r => r.reactions)
      .map(r => `[${r.from} → ${r.to}] (${r.type}): ${r.content}`)
      .join('\n');
  }

  getHistory(sessionId: string): DiscussionRound[] {
    return this.history.get(sessionId) || [];
  }

  clearHistory(sessionId: string): void {
    this.history.delete(sessionId);
  }
}
