import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { setupSocketHandler } from './socket/socketHandler';
import { config } from './config';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from './types';

async function main() {
  // Express 앱 생성
  const app = createApp();

  // HTTP 서버 생성
  const httpServer = createServer(app);

  // Socket.IO 서버 생성
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: config.cors,
    transports: ['websocket', 'polling'],
  });

  // 소켓 핸들러 설정
  setupSocketHandler(io);

  // 서버 시작
  httpServer.listen(config.port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎮 VibeCode Arena Backend Server                        ║
║                                                           ║
║   Server running on: http://localhost:${config.port}               ║
║   Environment: ${config.nodeEnv.padEnd(10)}                            ║
║   WebSocket: Ready                                        ║
║                                                           ║
║   Agents Active:                                          ║
║   • Vibe Agent (Code Generation)                          ║
║   • Validator Agent (Error Detection)                     ║
║   • Optimizer Agent (Performance)                         ║
║   • Security Agent (Vulnerability Check)                  ║
║   • UX Agent (Readability & Vibe)                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
