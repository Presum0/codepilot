const GITHUB_API_BASE = "https://api.github.com";
const COMMON_HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "CodePilot-API",
};

export async function fetchRepositoryMetadata(owner: string, repo: string) {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
    headers: COMMON_HEADERS,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`GitHub API error: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function fetchRepositoryTree(owner: string, repo: string, branch: string) {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
    headers: COMMON_HEADERS,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`GitHub API error: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function fetchFileContents(owner: string, repo: string, path: string, branch: string) {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: COMMON_HEADERS,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`GitHub API error: ${response.status} ${errorBody}`);
  }

  return response.json();
}
