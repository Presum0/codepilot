/**
 * Unit tests for the chunkContent function.
 *
 * Run with: npx ts-node --esm src/services/chunking/chunker.test.ts
 * (or: pnpm --filter api exec ts-node --esm src/services/chunking/chunker.test.ts)
 */
import { chunkContent, CHUNK_SIZE, OVERLAP } from './chunker';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// ── Test 1: Empty file ────────────────────────────────────────────────────────
console.log('\nTest 1: Empty file');
{
  const chunks = chunkContent('');
  assert(chunks.length === 0, 'empty string produces 0 chunks');

  const chunksWhitespace = chunkContent('   \n\n  ');
  assert(chunksWhitespace.length === 0, 'whitespace-only string produces 0 chunks');
}

// ── Test 2: Small file (fewer lines than CHUNK_SIZE) ─────────────────────────
console.log('\nTest 2: Small file');
{
  const content = 'function hello() {\n  console.log("hello");\n}\n';
  const chunks = chunkContent(content);
  assert(chunks.length === 1, 'small file produces exactly 1 chunk');
  assert(chunks[0].chunkIndex === 0, 'first chunk has index 0');
  assert(chunks[0].startLine === 1, 'start line is 1');
  assert(chunks[0].content.includes('hello'), 'chunk contains file content');
}

// ── Test 3: Multi-chunk file ──────────────────────────────────────────────────
console.log('\nTest 3: Multi-chunk file');
{
  // Generate a file with 3× CHUNK_SIZE lines
  const lines = Array.from({ length: CHUNK_SIZE * 3 }, (_, i) => `line ${i + 1}`);
  const content = lines.join('\n');
  const chunks = chunkContent(content);
  assert(chunks.length > 1, `file with ${CHUNK_SIZE * 3} lines produces more than 1 chunk (got ${chunks.length})`);
  assert(chunks[0].chunkIndex === 0, 'first chunk has index 0');
  assert(chunks[1].chunkIndex === 1, 'second chunk has index 1');
}

// ── Test 4: Line-number accuracy ──────────────────────────────────────────────
console.log('\nTest 4: Line-number accuracy');
{
  const lines = Array.from({ length: CHUNK_SIZE + 10 }, (_, i) => `line ${i + 1}`);
  const content = lines.join('\n');
  const chunks = chunkContent(content);

  assert(chunks[0].startLine === 1, 'first chunk starts at line 1');
  assert(chunks[0].endLine === CHUNK_SIZE, `first chunk ends at line ${CHUNK_SIZE}`);

  // Second chunk should start at CHUNK_SIZE - OVERLAP + 1 (1-indexed)
  const expectedStart = CHUNK_SIZE - OVERLAP + 1;
  assert(
    chunks[1].startLine === expectedStart,
    `second chunk starts at line ${expectedStart} (got ${chunks[1].startLine})`
  );
}

// ── Test 5: Deterministic output ──────────────────────────────────────────────
console.log('\nTest 5: Deterministic output');
{
  const content = Array.from({ length: 100 }, (_, i) => `const x${i} = ${i};`).join('\n');
  const run1 = chunkContent(content);
  const run2 = chunkContent(content);
  assert(run1.length === run2.length, 'same number of chunks on two runs');
  const allMatch = run1.every((c, i) =>
    c.chunkIndex === run2[i].chunkIndex &&
    c.startLine === run2[i].startLine &&
    c.endLine === run2[i].endLine &&
    c.content === run2[i].content
  );
  assert(allMatch, 'all chunk fields are identical across two runs');
}

// ── Test 6: Chunk indexes are sequential ──────────────────────────────────────
console.log('\nTest 6: Sequential chunk indexes');
{
  const lines = Array.from({ length: CHUNK_SIZE * 4 }, (_, i) => `x = ${i}`);
  const chunks = chunkContent(lines.join('\n'));
  const sequential = chunks.every((c, i) => c.chunkIndex === i);
  assert(sequential, 'chunk indexes are sequential starting from 0');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
