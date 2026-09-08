import Fastify from "fastify";
import cors from "@fastify/cors";

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

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "CodePilot-API"
      }
    });

    if (response.status === 404) {
      return reply.code(404).send({ error: "Repository not found or is private" });
    }

    if (!response.ok) {
      return reply.code(response.status).send({ error: "GitHub API error" });
    }

    const data = await response.json();

    return {
      name: data.name,
      owner: data.owner.login,
      description: data.description,
      url: data.html_url,
      defaultBranch: data.default_branch,
      stars: data.stargazers_count
    };
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

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "CodePilot-API"
      }
    });

    if (response.status === 404) {
      return reply.code(404).send({ error: "Repository tree not found" });
    }

    if (!response.ok) {
      return reply.code(response.status).send({ error: "GitHub API error" });
    }

    const data = await response.json();

    return {
      owner,
      repository: repo,
      branch,
      truncated: data.truncated,
      tree: data.tree.map((item: any) => ({
        path: item.path,
        type: item.type
      }))
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