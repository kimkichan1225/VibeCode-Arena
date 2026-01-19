import { v4 as uuidv4 } from 'uuid';
import { SessionData, VibeRequest, Phase, AgentMessage } from '../types';

class SessionManager {
  private sessions: Map<string, SessionData> = new Map();

  createSession(socketId: string): SessionData {
    const sessionId = uuidv4();
    const session: SessionData = {
      id: sessionId,
      request: null as any,
      currentCode: '',
      codeVersions: [],
      agentMessages: [],
      phase: 'idle',
      createdAt: Date.now(),
    };

    this.sessions.set(socketId, session);
    return session;
  }

  getSession(socketId: string): SessionData | undefined {
    return this.sessions.get(socketId);
  }

  updateSession(socketId: string, updates: Partial<SessionData>): void {
    const session = this.sessions.get(socketId);
    if (session) {
      Object.assign(session, updates);
    }
  }

  setRequest(socketId: string, request: VibeRequest): void {
    const session = this.sessions.get(socketId);
    if (session) {
      session.request = request;
    }
  }

  setPhase(socketId: string, phase: Phase): void {
    const session = this.sessions.get(socketId);
    if (session) {
      session.phase = phase;
    }
  }

  setCode(socketId: string, code: string): void {
    const session = this.sessions.get(socketId);
    if (session) {
      session.currentCode = code;
      session.codeVersions.push(code);
    }
  }

  addAgentMessage(socketId: string, message: AgentMessage): void {
    const session = this.sessions.get(socketId);
    if (session) {
      session.agentMessages.push(message);
    }
  }

  deleteSession(socketId: string): void {
    this.sessions.delete(socketId);
  }

  // 오래된 세션 정리
  cleanupOldSessions(maxAgeMs: number = 30 * 60 * 1000): void {
    const now = Date.now();
    for (const [socketId, session] of this.sessions) {
      if (now - session.createdAt > maxAgeMs) {
        this.sessions.delete(socketId);
      }
    }
  }
}

export const sessionManager = new SessionManager();
