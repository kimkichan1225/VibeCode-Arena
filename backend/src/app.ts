import express, { Application, Request, Response } from 'express';
import cors from 'cors';
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

  // 404 핸들러
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
