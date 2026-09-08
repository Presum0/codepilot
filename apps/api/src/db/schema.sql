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
