import Fastify from "fastify";
import cors from "@fastify/cors";
import { fetchRepositoryMetadata, fetchRepositoryTree, fetchFileContents } from "./github/api";
import { query } from "./db/index";

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: "http://localhost:5173",
});

app.get("/health", async () => {
  return { status: "ok" };
});

app.post("/repositories", async (request, reply) => {
  try {
    const { url } = request.body as { url?: string };
    if (!url) {
      return reply.code(400).send({ error: "URL is required" });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return reply.code(400).send({ error: "Invalid URL format" });
    }

    if (parsedUrl.hostname !== "github.com") {
      return reply.code(400).send({ error: "Only GitHub repository URLs are supported" });
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    if (pathParts.length < 2) {
      return reply.code(400).send({ error: "Invalid GitHub repository URL" });
    }

    const owner = pathParts[0];
    const repo = pathParts[1].replace(/\.git$/, "");

    let data;
    try {
      data = await fetchRepositoryMetadata(owner, repo);
    } catch (err: any) {
      if (err.message.includes("404")) {
        return reply.code(404).send({ error: "Repository not found or is private" });
      }
      return reply.code(500).send({ error: "GitHub API error fetching metadata" });
    }

    const resultData = {
      name: data.name,
      owner: data.owner.login,
      description: data.description,
      url: data.html_url,
      defaultBranch: data.default_branch,
      stars: data.stargazers_count
    };

    // Persist to database
    try {
      await query(
        `INSERT INTO repositories (github_url, owner, name, description, default_branch, stars)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (github_url) DO UPDATE SET
           description = EXCLUDED.description,
           default_branch = EXCLUDED.default_branch,
           stars = EXCLUDED.stars`,
        [resultData.url, resultData.owner, resultData.name, resultData.description, resultData.defaultBranch, resultData.stars]
      );
    } catch (dbErr) {
      app.log.error(dbErr);
      return reply.code(500).send({ error: "Failed to persist repository to database" });
    }

    return resultData;
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

app.get("/repositories/tree", async (request, reply) => {
  try {
    const { owner, repo, branch } = request.query as { owner?: string, repo?: string, branch?: string };
    
    if (!owner || !repo || !branch) {
      return reply.code(400).send({ error: "Missing required query parameters: owner, repo, branch" });
    }

    let data;
    try {
      data = await fetchRepositoryTree(owner, repo, branch);
    } catch (err: any) {
      if (err.message.includes("404")) {
        return reply.code(404).send({ error: "Repository tree not found" });
      }
      return reply.code(500).send({ error: "GitHub API error fetching tree" });
    }

    const treeArray = data.tree.map((item: any) => ({
      path: item.path,
      type: item.type
    }));

    // Persist to database
    try {
      const repoResult = await query(
        `SELECT id FROM repositories WHERE owner = $1 AND name = $2`,
        [owner, repo]
      );

      if (repoResult.rows.length > 0) {
        const repoId = repoResult.rows[0].id;
        
        // Delete old files
        await query(`DELETE FROM repository_files WHERE repository_id = $1`, [repoId]);
        
        // Insert new files
        if (treeArray.length > 0) {
           const paths = treeArray.map((i: any) => i.path);
           const types = treeArray.map((i: any) => i.type);
           await query(
             `INSERT INTO repository_files (repository_id, path, type)
              SELECT $1, unnest($2::text[]), unnest($3::text[])`,
             [repoId, paths, types]
           );
        }
      }
    } catch (dbErr) {
      app.log.error(dbErr);
      return reply.code(500).send({ error: "Failed to persist repository tree to database" });
    }

    return {
      owner,
      repository: repo,
      branch,
      truncated: data.truncated,
      tree: treeArray
    };
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

app.get("/repositories/file", async (request, reply) => {
  try {
    const { owner, repo, path, branch } = request.query as { owner?: string, repo?: string, path?: string, branch?: string };

    if (!owner || !repo || !path || !branch) {
      return reply.code(400).send({ error: "Missing required query parameters: owner, repo, path, branch" });
    }

    let data;
    try {
      data = await fetchFileContents(owner, repo, path, branch);
    } catch (err: any) {
      if (err.message.includes("404")) {
        return reply.code(404).send({ error: "File not found" });
      }
      return reply.code(500).send({ error: "GitHub API error fetching file" });
    }

    if (Array.isArray(data) || data.type !== "file") {
      return reply.code(400).send({ error: "Requested path is a directory, not a file" });
    }

    if (!data.content && data.content !== "") {
      return reply.code(400).send({ error: "File content missing or file is too large" });
    }

    const decodedContent = Buffer.from(data.content, "base64").toString("utf-8");

    return {
      path: data.path,
      content: decodedContent,
      encoding: "utf-8"
    };
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

const start = async () => {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();