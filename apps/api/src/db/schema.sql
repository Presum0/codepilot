CREATE TABLE IF NOT EXISTS repositories (
  id SERIAL PRIMARY KEY,
  github_url VARCHAR(255) UNIQUE NOT NULL,
  owner VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  default_branch VARCHAR(100) NOT NULL,
  stars INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repository_files (
  id SERIAL PRIMARY KEY,
  repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(repository_id, path)
);

CREATE INDEX IF NOT EXISTS idx_repository_files_repository_id ON repository_files(repository_id);

ALTER TABLE repository_files ADD COLUMN IF NOT EXISTS language VARCHAR(50);
ALTER TABLE repository_files ADD COLUMN IF NOT EXISTS size INTEGER;
ALTER TABLE repository_files ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE repository_files ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);
ALTER TABLE repository_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS code_chunks (
  id SERIAL PRIMARY KEY,
  repository_file_id INTEGER NOT NULL REFERENCES repository_files(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(repository_file_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_code_chunks_repository_file_id ON code_chunks(repository_file_id);

