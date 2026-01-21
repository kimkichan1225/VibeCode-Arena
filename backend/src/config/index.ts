import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // 에이전트 설정
  agents: {
    model: 'claude-sonnet-4-20250514', // Claude Sonnet 4 사용
    maxTokens: 2000,
    temperature: {
      vibe: 0.7,
      validator: 0.3,
      optimizer: 0.4,
      security: 0.2,
      ux: 0.5,
    },
  },

  // 오케스트레이터 설정
  orchestrator: {
    maxDiscussionRounds: 3,
    consensusThreshold: 0.6,
  },

  // CORS 설정
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
};
