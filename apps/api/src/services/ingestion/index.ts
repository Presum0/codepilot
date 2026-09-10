import { fetchRepositoryTree, fetchFileContents } from '../../github/api';
import { query } from '../../db/index';
import { shouldIngestFile } from './filter';
import { getLanguage, calculateSize, calculateHash } from './metadata';

export async function ingestRepository(owner: string, repo: string, branch: string, repositoryId: number) {
  let treeData;
  try {
    treeData = await fetchRepositoryTree(owner, repo, branch);
  } catch (error: any) {
    throw new Error(`Failed to fetch repository tree: ${error.message}`);
  }

  const allItems = treeData.tree || [];
  
  // Filter relevant files
  const eligibleFiles = allItems.filter((item: any) => 
    item.type === 'blob' && shouldIngestFile(item.path)
  );

  let filesProcessed = 0;
  let filesStored = 0;
  let filesSkipped = 0;
  let filesFailed = 0;

  filesSkipped = allItems.length - eligibleFiles.length;

  for (const file of eligibleFiles) {
    filesProcessed++;
    try {
      const fileData = await fetchFileContents(owner, repo, file.path, branch);
      
      // Some extremely large files might return truncated content or different formats
      if (!fileData || !fileData.content) {
        console.warn(`Skipping file ${file.path} due to missing content in GitHub response`);
        filesFailed++;
        continue;
      }

      const content = Buffer.from(fileData.content, 'base64').toString('utf8');
      const language = getLanguage(file.path);
      const size = calculateSize(content);
      const hash = calculateHash(content);

      await query(
        `INSERT INTO repository_files (repository_id, path, type, language, size, content, content_hash, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         ON CONFLICT (repository_id, path) DO UPDATE SET
           language = EXCLUDED.language,
           size = EXCLUDED.size,
           content = EXCLUDED.content,
           content_hash = EXCLUDED.content_hash,
           updated_at = CURRENT_TIMESTAMP
         WHERE repository_files.content_hash IS DISTINCT FROM EXCLUDED.content_hash`,
        [repositoryId, file.path, 'blob', language, size, content, hash]
      );
      
      filesStored++;
    } catch (error: any) {
      console.error(`Failed to ingest ${file.path}: ${error.message}`);
      filesFailed++;
    }
  }

  return {
    repositoryId,
    filesProcessed,
    filesStored,
    filesSkipped,
    filesFailed
  };
}
