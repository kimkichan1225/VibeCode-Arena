import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { LLMService } from '../../services/llm/LLMService';
import { AgentType, AgentOutput, Suggestion, CodeChange, VibeTone } from '../../types';
import { config } from '../../config';

export interface AgentConfig {
  type: AgentType;
  name: string;
  systemPrompt: string;
  temperature: number;
}

export interface AgentInput {
  sessionId: string;
  originalRequest: string;
  currentCode: string;
  tone: VibeTone;
  language: string;
  discussionHistory?: string;
  previousOutputs?: Map<AgentType, AgentOutput>;
}

export abstract class BaseAgent extends EventEmitter {
  protected config: AgentConfig;
  protected llmService: LLMService;

  constructor(config: AgentConfig, llmService: LLMService) {
    super();
    this.config = config;
    this.llmService = llmService;
  }

  get type(): AgentType {
    return this.config.type;
  }

  get name(): string {
    return this.config.name;
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const messageId = uuidv4();

    // 실행 시작 이벤트
    this.emit('start', { agent: this.type, messageId });

    try {
      // 프롬프트 생성
      const userPrompt = this.buildPrompt(input);

      // LLM 스트리밍 호출
      let fullResponse = '';

      for await (const chunk of this.llmService.streamCompletion({
        systemPrompt: this.config.systemPrompt,
        userPrompt,
        temperature: this.config.temperature,
        maxTokens: config.agents.maxTokens,
      })) {
        fullResponse += chunk;
        this.emit('chunk', { messageId, chunk });
      }

      // 응답 파싱
      const parsed = this.parseResponse(fullResponse, input);

      const output: AgentOutput = {
        agent: this.type,
        analysis: parsed.analysis,
        suggestions: parsed.suggestions,
        codeChanges: parsed.codeChanges,
        metadata: {
          confidence: this.calculateConfidence(parsed),
          processingTime: Date.now() - startTime,
          ...parsed.metadata,
        },
      };

      // 완료 이벤트
      this.emit('end', { messageId, output });

      return output;
    } catch (error) {
      this.emit('error', { messageId, error });
      throw error;
    }
  }

  protected abstract buildPrompt(input: AgentInput): string;

  protected parseResponse(
    response: string,
    input: AgentInput
  ): {
    analysis: string;
    suggestions: Suggestion[];
    codeChanges: CodeChange[];
    metadata?: Record<string, any>;
  } {
    try {
      // JSON 블록 추출
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          analysis: response,
          suggestions: [],
          codeChanges: [],
        };
      }

      const json = JSON.parse(jsonMatch[0]);
      return this.transformResponse(json, input);
    } catch (error) {
      console.error(`[${this.type}] Failed to parse response:`, error);
      return {
        analysis: response,
        suggestions: [],
        codeChanges: [],
      };
    }
  }

  protected abstract transformResponse(
    json: any,
    input: AgentInput
  ): {
    analysis: string;
    suggestions: Suggestion[];
    codeChanges: CodeChange[];
    metadata?: Record<string, any>;
  };

  protected calculateConfidence(parsed: {
    analysis: string;
    suggestions: Suggestion[];
  }): number {
    // 기본 신뢰도 계산
    let confidence = 0.7;

    if (parsed.suggestions.length > 0) {
      confidence += 0.1;
    }

    if (parsed.analysis.length > 100) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  protected createCodeChange(
    suggestion: any,
    agent: AgentType
  ): CodeChange | undefined {
    if (!suggestion?.action || !suggestion?.newCode) {
      return undefined;
    }

    return {
      id: uuidv4(),
      type: suggestion.action as 'insert' | 'replace' | 'delete',
      startLine: suggestion.targetLines?.start || suggestion.line || 1,
      endLine: suggestion.targetLines?.end || suggestion.line || 1,
      oldCode: suggestion.oldCode,
      newCode: suggestion.newCode,
      reason: suggestion.description || '',
      agent,
    };
  }
}
