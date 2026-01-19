import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { LLMService } from '../services/llm/LLMService';
import { fileService } from '../services/file/FileService';
import {
  ProjectRequest,
  ProjectResult,
  ProjectFile,
  AgentMessage,
  Phase,
  ConsensusResult,
} from '../types';
import { getProjectVibeSystemPrompt, PROJECT_REVIEWER_SYSTEM_PROMPT } from '../agents/prompts';

export class ProjectOrchestrator extends EventEmitter {
  private llmService: LLMService;

  constructor() {
    super();
    this.llmService = new LLMService();
  }

  async processProjectRequest(request: ProjectRequest): Promise<ProjectResult> {
    const startTime = Date.now();
    const agentMessages: AgentMessage[] = [];
    const files: ProjectFile[] = [];

    try {
      // ===== Phase 1: 프로젝트 생성 =====
      this.emitPhase('generation', 'Vibe Agent가 프로젝트를 생성하고 있습니다...');

      const messageId = uuidv4();
      this.emit('agent:start', { agent: 'vibe', messageId });

      // 기존 파일 컨텍스트 구성
      let existingContext = '';
      if (request.existingFiles && request.existingFiles.length > 0) {
        existingContext = request.existingFiles
          .slice(0, 5) // 최대 5개 파일만
          .map((f) => `// ${f.path}\n${f.content.slice(0, 500)}...`)
          .join('\n\n');
      }

      // 프로젝트 생성 프롬프트
      const systemPrompt = getProjectVibeSystemPrompt({
        tone: request.tone,
        framework: request.framework || 'react',
        includeTests: request.includeTests,
        includeStyles: request.includeStyles,
        existingContext: existingContext || undefined,
      });

      const userPrompt = `프로젝트 이름: ${request.projectName}
언어: ${request.language}

요청: ${request.prompt}

위 요구사항에 맞는 완전한 프로젝트를 생성해주세요.`;

      // LLM 호출
      const response = await this.llmService.completion({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 4096,
      });

      // JSON 파싱
      let projectOutput: any;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          projectOutput = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('JSON 응답을 찾을 수 없습니다.');
        }
      } catch (parseError) {
        throw new Error('프로젝트 생성 응답을 파싱할 수 없습니다.');
      }

      // 파일 추출
      const generatedFiles: ProjectFile[] = (projectOutput.files || []).map((f: any) => ({
        path: f.path,
        name: f.name || f.path.split('/').pop(),
        content: f.content,
        language: f.language || request.language,
        type: f.type || 'other',
      }));

      files.push(...generatedFiles);

      // 에이전트 메시지 기록
      const vibeMessage: AgentMessage = {
        id: messageId,
        agent: 'vibe',
        content: projectOutput.explanation || '프로젝트가 생성되었습니다.',
        timestamp: Date.now(),
        metadata: {
          filesGenerated: generatedFiles.length,
          structure: projectOutput.structure,
          dependencies: projectOutput.dependencies,
        },
      };
      agentMessages.push(vibeMessage);

      this.emit('agent:end', { messageId, output: vibeMessage });

      // 각 파일 이벤트 발생
      for (const file of generatedFiles) {
        this.emit('project:file:end', { file });
      }

      // ===== Phase 2: 프로젝트 리뷰 (옵션) =====
      this.emitPhase('review', 'Code Reviewer가 프로젝트를 검토하고 있습니다...');

      const reviewMessageId = uuidv4();
      this.emit('agent:start', { agent: 'reviewer', messageId: reviewMessageId });

      const filesContext = generatedFiles
        .map((f) => `// ${f.path}\n${f.content}`)
        .join('\n\n---\n\n');

      const reviewResponse = await this.llmService.completion({
        systemPrompt: PROJECT_REVIEWER_SYSTEM_PROMPT,
        userPrompt: `다음 프로젝트를 검토해주세요:

프로젝트: ${request.projectName}
프레임워크: ${request.framework}

파일들:
${filesContext}`,
        temperature: 0.3,
        maxTokens: 2048,
      });

      let reviewOutput: any = {};
      try {
        const jsonMatch = reviewResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          reviewOutput = JSON.parse(jsonMatch[0]);
        }
      } catch {
        reviewOutput = { summary: '리뷰 완료', vibeScore: 7 };
      }

      const reviewMessage: AgentMessage = {
        id: reviewMessageId,
        agent: 'reviewer',
        content: reviewOutput.summary || '프로젝트 리뷰 완료',
        timestamp: Date.now(),
        metadata: {
          vibeScore: reviewOutput.vibeScore || 7,
          fileIssues: reviewOutput.fileIssues,
          strengths: reviewOutput.strengths,
        },
      };
      agentMessages.push(reviewMessage);

      this.emit('agent:end', { messageId: reviewMessageId, output: reviewMessage });

      // ===== Phase 3: 파일 저장 (basePath가 있는 경우) =====
      let createdPaths: string[] = [];

      if (request.basePath) {
        this.emitPhase('merging', '파일을 저장하고 있습니다...');

        try {
          createdPaths = await fileService.writeProjectFiles(request.basePath, files);
        } catch (saveError) {
          console.error('파일 저장 실패:', saveError);
          // 저장 실패해도 결과는 반환
        }
      }

      // ===== Phase 4: 완료 =====
      this.emitPhase('complete', '프로젝트 생성이 완료되었습니다!');

      const consensus: ConsensusResult = {
        accepted: [],
        rejected: [],
        vibeScore: reviewOutput.vibeScore || 7,
        summary: reviewOutput.summary || '프로젝트가 성공적으로 생성되었습니다.',
      };

      const result: ProjectResult = {
        success: true,
        projectName: request.projectName,
        files,
        createdPaths,
        consensus,
        agentMessages,
        metrics: {
          totalTime: Date.now() - startTime,
          filesGenerated: files.length,
          vibeScore: reviewOutput.vibeScore || 7,
        },
      };

      this.emit('project:complete', result);

      return result;
    } catch (error) {
      this.emitPhase('error', `오류 발생: ${(error as Error).message}`);
      throw error;
    }
  }

  private emitPhase(phase: Phase, message: string): void {
    this.emit('phase:change', { phase, message });
  }
}
