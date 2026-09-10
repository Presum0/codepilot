export interface Chunk {
  chunkIndex: number;
  startLine: number; // 1-indexed, inclusive
  endLine: number;   // 1-indexed, inclusive
  content: string;
}

/**
 * Split source-file content into line-based chunks.
 *
 * Strategy:
 *  - Split content by newline.
 *  - Accumulate lines into a chunk until CHUNK_SIZE lines are reached.
 *  - Overlap: the last OVERLAP lines of chunk N become the first lines of chunk N+1
 *    so context is not lost at boundaries.
 *  - Empty files produce zero chunks.
 *  - Files with fewer lines than CHUNK_SIZE produce exactly one chunk.
 */
export const CHUNK_SIZE = 50;   // max lines per chunk
export const OVERLAP = 5;       // lines shared between consecutive chunks

export function chunkContent(content: string): Chunk[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const lines = content.split('\n');
  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  let i = 0;

  while (i < lines.length) {
    const startLineIndex = i;                          // 0-based
    const endLineIndex = Math.min(i + CHUNK_SIZE - 1, lines.length - 1); // 0-based

    const chunkLines = lines.slice(startLineIndex, endLineIndex + 1);
    const chunkContent = chunkLines.join('\n');

    // Only emit non-blank chunks
    if (chunkContent.trim().length > 0) {
      chunks.push({
        chunkIndex,
        startLine: startLineIndex + 1,  // convert to 1-indexed
        endLine: endLineIndex + 1,      // convert to 1-indexed
        content: chunkContent,
      });
      chunkIndex++;
    }

    // Advance, stepping back by OVERLAP so next chunk overlaps
    const advance = CHUNK_SIZE - OVERLAP;
    i += advance;

    // If remaining lines are only the overlap tail, stop to avoid a tiny orphan chunk
    if (i < lines.length && lines.length - i <= OVERLAP) {
      break;
    }
  }

  return chunks;
}
