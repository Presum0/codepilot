import { query } from '../../db/index';
import { chunkContent } from './chunker';

export interface ChunkingStats {
  filesProcessed: number;
  filesSkipped: number;
  chunksCreated: number;
}

/**
 * For a given repository (by DB id), fetch all ingested source files,
 * chunk their content, delete old chunks, and insert fresh ones.
 */
export async function chunkRepository(repositoryId: number): Promise<ChunkingStats> {
  // Fetch all files that have content stored
  const filesResult = await query(
    `SELECT id, path, content FROM repository_files
     WHERE repository_id = $1 AND content IS NOT NULL AND type = 'blob'`,
    [repositoryId]
  );

  const files = filesResult.rows;

  let filesProcessed = 0;
  let filesSkipped = 0;
  let chunksCreated = 0;

  for (const file of files) {
    const chunks = chunkContent(file.content);

    if (chunks.length === 0) {
      console.log(`Skipping empty file: ${file.path}`);
      filesSkipped++;
      continue;
    }

    try {
      // Delete existing chunks for this file — simplest idempotency strategy
      await query(`DELETE FROM code_chunks WHERE repository_file_id = $1`, [file.id]);

      // Bulk insert new chunks
      for (const chunk of chunks) {
        await query(
          `INSERT INTO code_chunks (repository_file_id, chunk_index, start_line, end_line, content)
           VALUES ($1, $2, $3, $4, $5)`,
          [file.id, chunk.chunkIndex, chunk.startLine, chunk.endLine, chunk.content]
        );
      }

      chunksCreated += chunks.length;
      filesProcessed++;
    } catch (err: any) {
      console.error(`Failed to chunk file ${file.path}: ${err.message}`);
      filesSkipped++;
    }
  }

  return { filesProcessed, filesSkipped, chunksCreated };
}
