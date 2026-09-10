import crypto from 'node:crypto';

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript React',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript React',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.py': 'Python',
  '.java': 'Java',
  '.c': 'C',
  '.cpp': 'C++',
  '.h': 'C/C++ Header',
  '.hpp': 'C++ Header',
  '.go': 'Go',
  '.rs': 'Rust',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.kts': 'Kotlin',
  '.sql': 'SQL',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.toml': 'TOML',
  '.md': 'Markdown'
};

export function getLanguage(path: string): string | null {
  const lastDotIndex = path.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return null; // or 'unknown'
  }
  const ext = path.substring(lastDotIndex).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] || null;
}

export function calculateSize(content: string): number {
  return Buffer.byteLength(content, 'utf8');
}

export function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}
