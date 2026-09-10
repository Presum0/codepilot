export function shouldIngestFile(path: string): boolean {
  // Ignore specific directories
  const ignoredDirs = [
    'node_modules/',
    '.git/',
    'dist/',
    'build/',
    'coverage/',
    '.next/',
    '.nuxt/',
    'vendor/'
  ];

  for (const dir of ignoredDirs) {
    if (path.includes(dir) || path.startsWith(dir.replace('/', ''))) {
      return false;
    }
  }

  // Ignore minified/generated files
  if (path.endsWith('.min.js') || path.endsWith('.min.css') || path.endsWith('.map')) {
    return false;
  }

  // Ignore common lockfiles
  if (path.endsWith('package-lock.json') || path.endsWith('yarn.lock') || path.endsWith('pnpm-lock.yaml') || path.endsWith('Cargo.lock')) {
    return false;
  }

  // Ignore media/binary files
  const ignoredExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
    '.pdf', '.zip', '.tar', '.gz', '.mp4', '.mov', '.mp3', '.wav'
  ];

  const lowerPath = path.toLowerCase();
  for (const ext of ignoredExtensions) {
    if (lowerPath.endsWith(ext)) {
      return false;
    }
  }

  // Specific whitelist for source code files
  const allowedExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.java', '.c', '.cpp', '.h', '.hpp',
    '.go', '.rs', '.rb', '.php', '.cs', '.swift',
    '.kt', '.kts', '.sql', '.html', '.css', '.scss',
    '.json', '.yaml', '.yml', '.toml', '.md'
  ];

  for (const ext of allowedExtensions) {
    if (lowerPath.endsWith(ext)) {
      return true;
    }
  }

  // If we reach here, it's not explicitly allowed.
  // For safety and focus, we return false.
  return false;
}
