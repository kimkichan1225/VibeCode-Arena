import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { sessionManager } from './sessionManager';
import { Orchestrator } from '../orchestrator/Orchestrator';
import { ProjectOrchestrator } from '../orchestrator/ProjectOrchestrator';
import {
  VibeRequest,
  ProjectRequest,
  ServerToClientEvents,
  ClientToServerEvents,
  Phase,
} from '../types';

export function setupSocketHandler(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`Client connected: ${socket.id}`);

    // 세션 생성
    const session = sessionManager.createSession(socket.id);
    socket.emit('session:init', { sessionId: session.id });

    // 바이브 요청 처리
    socket.on('vibe:request', async (data: VibeRequest) => {
      console.log(`Vibe request from ${socket.id}:`, data.prompt);

      // 세션에 요청 저장
      sessionManager.setRequest(socket.id, data);

      // 오케스트레이터 생성
      const orchestrator = new Orchestrator();

      // 이벤트 리스닝
      orchestrator.on('phase:change', ({ phase, message }) => {
        sessionManager.setPhase(socket.id, phase as Phase);
        socket.emit('phase:change', { phase: phase as Phase, message });
      });

      orchestrator.on('agent:start', ({ agent, messageId }) => {
        socket.emit('agent:message:start', { agent, messageId });
      });

      orchestrator.on('agent:chunk', ({ messageId, chunk }) => {
        socket.emit('agent:message:chunk', { messageId, chunk });
      });

      orchestrator.on('agent:end', ({ messageId, output }) => {
        sessionManager.addAgentMessage(socket.id, {
          id: messageId,
          agent: output.agent,
          content: output.analysis,
          timestamp: Date.now(),
          suggestions: output.suggestions,
          codeChanges: output.codeChanges,
          metadata: output.metadata,
        });

        socket.emit('agent:message:end', {
          messageId,
          content: output.analysis,
          metadata: output.metadata,
        });
      });

      orchestrator.on('code:update', ({ code, version }) => {
        sessionManager.setCode(socket.id, code);
        socket.emit('code:update', { code, version });
      });

      orchestrator.on('consensus:result', (result) => {
        socket.emit('consensus:result', result);
      });

      // 토론 이벤트 리스닝
      orchestrator.on('discussion:round:start', ({ sessionId, round, conflictCount }) => {
        socket.emit('discussion:round:start', { round, conflictCount });
      });

      orchestrator.on('discussion:reaction', ({ sessionId, reaction }) => {
        socket.emit('discussion:reaction', { reaction });
      });

      orchestrator.on('discussion:round:end', ({ sessionId, round, resolvedCount }) => {
        socket.emit('discussion:round:end', { round, resolvedCount });
      });

      orchestrator.on('process:complete', (result) => {
        socket.emit('process:complete', result);
      });

      // 요청 처리
      try {
        await orchestrator.processRequest({
          ...data,
          sessionId: session.id,
        });
      } catch (error) {
        console.error('Error processing vibe request:', error);
        socket.emit('error', {
          message: (error as Error).message || 'An error occurred',
          phase: 'error',
        });
      }
    });

    // 프로젝트 모드 요청 처리
    socket.on('project:request', async (data: ProjectRequest) => {
      console.log(`Project request from ${socket.id}:`, data.projectName);

      // 프로젝트 오케스트레이터 생성
      const orchestrator = new ProjectOrchestrator();

      // 이벤트 리스닝
      orchestrator.on('phase:change', ({ phase, message }) => {
        sessionManager.setPhase(socket.id, phase as Phase);
        socket.emit('phase:change', { phase: phase as Phase, message });
      });

      orchestrator.on('agent:start', ({ agent, messageId }) => {
        socket.emit('agent:message:start', { agent, messageId });
      });

      orchestrator.on('agent:end', ({ messageId, output }) => {
        sessionManager.addAgentMessage(socket.id, output);
        socket.emit('agent:message:end', {
          messageId,
          content: output.content,
          metadata: output.metadata,
        });
      });

      orchestrator.on('project:file:end', ({ file }) => {
        (socket as any).emit('project:file:end', { file });
      });

      orchestrator.on('project:complete', (result) => {
        (socket as any).emit('project:complete', result);
      });

      // 요청 처리
      try {
        await orchestrator.processProjectRequest({
          ...data,
          sessionId: session.id,
        });
      } catch (error) {
        console.error('Error processing project request:', error);
        socket.emit('error', {
          message: (error as Error).message || 'An error occurred',
          phase: 'error',
        });
      }
    });

    // 연결 해제
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      sessionManager.deleteSession(socket.id);
    });
  });

  // 주기적으로 오래된 세션 정리
  setInterval(() => {
    sessionManager.cleanupOldSessions();
  }, 5 * 60 * 1000); // 5분마다
}
