import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import fileRoutes from './routes/fileRoutes';

export function createApp(): Application {
  const app = express();

  // 미들웨어
  app.use(cors(config.cors));
  app.use(express.json({ limit: '10mb' })); // 파일 내용 전송을 위해 크기 증가

  // 헬스 체크
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // API 정보
  app.get('/api/info', (req: Request, res: Response) => {
    res.json({
      name: 'VibeCode Arena API',
      version: '1.0.0',
      agents: ['vibe', 'reviewer'],
      tones: ['clean', 'fast', 'fancy', 'hardcore'],
      languages: ['typescript', 'javascript', 'python'],
      features: ['single', 'project'],
    });
  });

  // 파일 시스템 API
  app.use('/api/files', fileRoutes);

  // Production: 프론트엔드 정적 파일 서빙
  if (config.nodeEnv === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist');

    // 정적 파일 서빙
    app.use(express.static(frontendPath));

    // SPA 라우팅: API가 아닌 모든 요청은 index.html로
    app.get('*', (req: Request, res: Response) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    });
  } else {
    // Development: 404 핸들러
    app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  return app;
}
