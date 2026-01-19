import { Router, Request, Response } from 'express';
import { fileService, ProjectFile } from '../services/file/FileService';
import path from 'path';

const router = Router();

// 작업 디렉토리 설정
router.post('/workspace', async (req: Request, res: Response) => {
  try {
    const { path: workspacePath } = req.body;

    if (!workspacePath) {
      return res.status(400).json({ error: '경로가 필요합니다.' });
    }

    if (!fileService.isPathSafe(workspacePath)) {
      return res.status(403).json({ error: '접근할 수 없는 경로입니다.' });
    }

    if (!fileService.exists(workspacePath)) {
      return res.status(404).json({ error: '경로가 존재하지 않습니다.' });
    }

    fileService.setWorkspace(workspacePath);
    res.json({ success: true, workspace: workspacePath });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 현재 작업 디렉토리 가져오기
router.get('/workspace', (req: Request, res: Response) => {
  res.json({ workspace: fileService.getWorkspace() });
});

// 디렉토리 내용 조회
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { path: dirPath } = req.query;
    const targetPath = dirPath as string || fileService.getWorkspace();

    if (!fileService.isPathSafe(targetPath)) {
      return res.status(403).json({ error: '접근할 수 없는 경로입니다.' });
    }

    const files = await fileService.listDirectory(targetPath);
    res.json({ files, currentPath: targetPath });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 파일 읽기
router.get('/read', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: '파일 경로가 필요합니다.' });
    }

    if (!fileService.isPathSafe(filePath as string)) {
      return res.status(403).json({ error: '접근할 수 없는 경로입니다.' });
    }

    const content = await fileService.readFile(filePath as string);
    const language = fileService.detectLanguage(filePath as string);
    const fileType = fileService.detectFileType(filePath as string);

    res.json({ content, language, fileType, path: filePath });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 파일 저장
router.post('/write', async (req: Request, res: Response) => {
  try {
    const { path: filePath, content } = req.body;

    if (!filePath || content === undefined) {
      return res.status(400).json({ error: '파일 경로와 내용이 필요합니다.' });
    }

    if (!fileService.isPathSafe(filePath)) {
      return res.status(403).json({ error: '접근할 수 없는 경로입니다.' });
    }

    await fileService.writeFile(filePath, content);
    res.json({ success: true, path: filePath });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 프로젝트 파일들 일괄 저장 (프로젝트 모드)
router.post('/project', async (req: Request, res: Response) => {
  try {
    const { basePath, files } = req.body as { basePath: string; files: ProjectFile[] };

    if (!basePath || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: '기본 경로와 파일 목록이 필요합니다.' });
    }

    if (!fileService.isPathSafe(basePath)) {
      return res.status(403).json({ error: '접근할 수 없는 경로입니다.' });
    }

    const createdFiles = await fileService.writeProjectFiles(basePath, files);
    res.json({ success: true, createdFiles });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 디렉토리 생성
router.post('/directory', async (req: Request, res: Response) => {
  try {
    const { path: dirPath } = req.body;

    if (!dirPath) {
      return res.status(400).json({ error: '디렉토리 경로가 필요합니다.' });
    }

    if (!fileService.isPathSafe(dirPath)) {
      return res.status(403).json({ error: '접근할 수 없는 경로입니다.' });
    }

    await fileService.createDirectory(dirPath);
    res.json({ success: true, path: dirPath });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 프로젝트 분석
router.get('/analyze', async (req: Request, res: Response) => {
  try {
    const { path: projectPath, depth } = req.query;
    const targetPath = (projectPath as string) || fileService.getWorkspace();
    const maxDepth = depth ? parseInt(depth as string, 10) : 3;

    if (!fileService.isPathSafe(targetPath)) {
      return res.status(403).json({ error: '접근할 수 없는 경로입니다.' });
    }

    const structure = await fileService.analyzeProject(targetPath, maxDepth);
    res.json(structure);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 파일 정보 조회
router.get('/info', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: '파일 경로가 필요합니다.' });
    }

    if (!fileService.isPathSafe(filePath as string)) {
      return res.status(403).json({ error: '접근할 수 없는 경로입니다.' });
    }

    const info = await fileService.getFileInfo(filePath as string);
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
