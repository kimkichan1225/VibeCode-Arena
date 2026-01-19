import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, statSync } from 'fs';

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  extension?: string;
  modifiedAt?: number;
}

export interface ProjectFile {
  path: string;
  name: string;
  content: string;
  language: string;
  type: 'component' | 'style' | 'test' | 'util' | 'config' | 'other';
}

export interface ProjectStructure {
  name: string;
  basePath: string;
  files: ProjectFile[];
}

// 허용된 확장자
const ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss', '.less',
  '.html', '.md', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h',
  '.vue', '.svelte', '.astro', '.yaml', '.yml', '.toml', '.xml',
  '.sql', '.graphql', '.prisma', '.env.example', '.gitignore'
];

// 제외할 디렉토리
const EXCLUDED_DIRS = [
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  '__pycache__', '.venv', 'venv', '.idea', '.vscode', 'coverage'
];

export class FileService {
  private workspacePath: string;

  constructor(workspacePath?: string) {
    this.workspacePath = workspacePath || process.cwd();
  }

  setWorkspace(workspacePath: string): void {
    this.workspacePath = workspacePath;
  }

  getWorkspace(): string {
    return this.workspacePath;
  }

  // 디렉토리 내용 읽기
  async listDirectory(dirPath?: string): Promise<FileInfo[]> {
    const targetPath = dirPath || this.workspacePath;

    try {
      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      const files: FileInfo[] = [];

      for (const entry of entries) {
        // 숨김 파일 및 제외 디렉토리 스킵
        if (entry.name.startsWith('.') && entry.name !== '.env.example') {
          if (entry.isDirectory()) continue;
        }
        if (entry.isDirectory() && EXCLUDED_DIRS.includes(entry.name)) {
          continue;
        }

        const fullPath = path.join(targetPath, entry.name);
        const fileInfo: FileInfo = {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
        };

        if (!entry.isDirectory()) {
          try {
            const stat = statSync(fullPath);
            fileInfo.size = stat.size;
            fileInfo.modifiedAt = stat.mtimeMs;
            fileInfo.extension = path.extname(entry.name);
          } catch {}
        }

        files.push(fileInfo);
      }

      // 디렉토리 먼저, 그 다음 파일 (알파벳 순)
      return files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      throw new Error(`디렉토리를 읽을 수 없습니다: ${(error as Error).message}`);
    }
  }

  // 파일 읽기
  async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`파일을 읽을 수 없습니다: ${(error as Error).message}`);
    }
  }

  // 파일 쓰기
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // 디렉토리가 없으면 생성
      const dir = path.dirname(filePath);
      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
      }
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`파일을 쓸 수 없습니다: ${(error as Error).message}`);
    }
  }

  // 여러 파일 한번에 쓰기 (프로젝트 모드)
  async writeProjectFiles(basePath: string, files: ProjectFile[]): Promise<string[]> {
    const createdFiles: string[] = [];

    for (const file of files) {
      const fullPath = path.join(basePath, file.path);
      await this.writeFile(fullPath, file.content);
      createdFiles.push(fullPath);
    }

    return createdFiles;
  }

  // 디렉토리 생성
  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`디렉토리를 생성할 수 없습니다: ${(error as Error).message}`);
    }
  }

  // 파일/디렉토리 존재 확인
  exists(targetPath: string): boolean {
    return existsSync(targetPath);
  }

  // 파일 정보 가져오기
  async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const stat = await fs.stat(filePath);
      return {
        name: path.basename(filePath),
        path: filePath,
        isDirectory: stat.isDirectory(),
        size: stat.size,
        extension: path.extname(filePath),
        modifiedAt: stat.mtimeMs,
      };
    } catch (error) {
      throw new Error(`파일 정보를 가져올 수 없습니다: ${(error as Error).message}`);
    }
  }

  // 확장자로 언어 감지
  detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.css': 'css',
      '.scss': 'scss',
      '.less': 'less',
      '.html': 'html',
      '.json': 'json',
      '.md': 'markdown',
      '.sql': 'sql',
      '.graphql': 'graphql',
      '.vue': 'vue',
      '.svelte': 'svelte',
    };
    return languageMap[ext] || 'plaintext';
  }

  // 파일 타입 감지
  detectFileType(filePath: string): ProjectFile['type'] {
    const name = path.basename(filePath).toLowerCase();
    const ext = path.extname(filePath).toLowerCase();

    if (name.includes('.test.') || name.includes('.spec.') || name.includes('__test__')) {
      return 'test';
    }
    if (['.css', '.scss', '.less', '.styled.ts', '.styled.tsx'].some(e => name.endsWith(e))) {
      return 'style';
    }
    if (name.includes('config') || name.includes('rc.') || ext === '.json') {
      return 'config';
    }
    if (name.includes('util') || name.includes('helper') || name.includes('lib')) {
      return 'util';
    }
    if (['.tsx', '.jsx', '.vue', '.svelte'].includes(ext)) {
      return 'component';
    }
    return 'other';
  }

  // 프로젝트 구조 분석
  async analyzeProject(projectPath: string, maxDepth: number = 3): Promise<ProjectStructure> {
    const files: ProjectFile[] = [];

    const scanDir = async (dirPath: string, depth: number) => {
      if (depth > maxDepth) return;

      const entries = await this.listDirectory(dirPath);

      for (const entry of entries) {
        if (entry.isDirectory) {
          await scanDir(entry.path, depth + 1);
        } else {
          const ext = entry.extension || '';
          if (ALLOWED_EXTENSIONS.includes(ext)) {
            try {
              const content = await this.readFile(entry.path);
              files.push({
                path: path.relative(projectPath, entry.path),
                name: entry.name,
                content,
                language: this.detectLanguage(entry.path),
                type: this.detectFileType(entry.path),
              });
            } catch {}
          }
        }
      }
    };

    await scanDir(projectPath, 0);

    return {
      name: path.basename(projectPath),
      basePath: projectPath,
      files,
    };
  }

  // 경로 유효성 검사 (보안)
  isPathSafe(targetPath: string): boolean {
    const resolved = path.resolve(targetPath);
    // 시스템 디렉토리 접근 차단
    const dangerousPaths = ['C:\\Windows', 'C:\\Program Files', '/etc', '/usr', '/bin', '/sbin'];
    return !dangerousPaths.some(dp => resolved.startsWith(dp));
  }
}

export const fileService = new FileService();
