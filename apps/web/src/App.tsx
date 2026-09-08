import { useEffect, useState } from "react";

type RepoData = {
  name: string;
  owner: string;
  description: string;
  url: string;
  defaultBranch: string;
  stars: number;
};

type TreeItem = {
  path: string;
  type: string;
};

type FileData = {
  path: string;
  content: string;
};

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoData, setRepoData] = useState<RepoData | null>(null);

  const [treeData, setTreeData] = useState<TreeItem[] | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/health")
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "ok") {
          setBackendStatus("Connected");
        }
      })
      .catch(() => {
        setBackendStatus("Disconnected");
      });
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setRepoData(null);
    setTreeData(null);
    setTreeError(null);
    setSelectedFile(null);
    setFileError(null);

    try {
      const response = await fetch("http://localhost:3000/repositories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect to repository");
      }

      setRepoData(data);

      // Fetch repository tree
      setTreeLoading(true);
      try {
        const treeResponse = await fetch(`http://localhost:3000/repositories/tree?owner=${data.owner}&repo=${data.name}&branch=${data.defaultBranch}`);
        const treeJson = await treeResponse.json();

        if (!treeResponse.ok) {
          throw new Error(treeJson.error || "Failed to fetch repository tree");
        }

        setTreeData(treeJson.tree);
      } catch (treeErr: any) {
        setTreeError(treeErr.message || "An unexpected error occurred while fetching the tree");
      } finally {
        setTreeLoading(false);
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (path: string) => {
    if (!repoData) return;

    setSelectedFile(null);
    setFileError(null);
    setFileLoading(true);

    try {
      const response = await fetch(
        `http://localhost:3000/repositories/file?owner=${repoData.owner}&repo=${repoData.name}&path=${encodeURIComponent(path)}&branch=${repoData.defaultBranch}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch file contents");
      }

      setSelectedFile(data);
    } catch (err: any) {
      setFileError(err.message || "An unexpected error occurred while fetching the file");
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>CodePilot</h1>
      <p style={{ color: backendStatus === "Connected" ? "green" : "red" }}>
        Backend: {backendStatus}
      </p>

      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h2>Connect a GitHub Repository</h2>
        <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repository"
            style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            disabled={loading}
          />
          <button
            onClick={handleConnect}
            disabled={loading || !url}
            style={{ padding: "8px 16px", borderRadius: "4px", background: "#0066cc", color: "white", border: "none", cursor: loading || !url ? "not-allowed" : "pointer", opacity: loading || !url ? 0.7 : 1 }}
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: "1rem", padding: "10px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px" }}>
            {error}
          </div>
        )}

        {repoData && (
          <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
            <h3 style={{ marginTop: 0 }}>Repository Information</h3>
            <p><strong>Name:</strong> {repoData.name}</p>
            <p><strong>Owner:</strong> {repoData.owner}</p>
            <p><strong>Description:</strong> {repoData.description || "No description provided."}</p>
            <p><strong>URL:</strong> <a href={repoData.url} target="_blank" rel="noreferrer">{repoData.url}</a></p>
            <p><strong>Default Branch:</strong> {repoData.defaultBranch}</p>
            <p><strong>Stars:</strong> {repoData.stars}</p>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
        {repoData && (
          <div style={{ flex: 1, padding: "1.5rem", border: "1px solid #ccc", borderRadius: "8px" }}>
            <h2>Files</h2>
            {treeLoading && <p>Loading repository tree...</p>}
            {treeError && (
              <div style={{ padding: "10px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px" }}>
                {treeError}
              </div>
            )}
            {treeData && (
              <div style={{ marginTop: "1rem", fontFamily: "monospace", fontSize: "14px", maxHeight: "600px", overflowY: "auto", background: "#fafafa", padding: "1rem", borderRadius: "4px", border: "1px solid #eee" }}>
                {treeData.map((item, index) => {
                  const isFile = item.type === "blob";
                  return (
                    <div
                      key={index}
                      style={{
                        marginBottom: "4px",
                        paddingLeft: `${(item.path.split("/").length - 1) * 15}px`,
                        cursor: isFile ? "pointer" : "default",
                        color: isFile ? "#0066cc" : "inherit",
                        textDecoration: isFile ? "underline" : "none"
                      }}
                      onClick={() => isFile && handleFileClick(item.path)}
                    >
                      <span style={{ marginRight: "8px", textDecoration: "none", display: "inline-block" }}>
                        {item.type === "tree" ? "📁" : "📄"}
                      </span>
                      {item.path.split("/").pop()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {(fileLoading || fileError || selectedFile) && (
          <div style={{ flex: 2, padding: "1.5rem", border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <h2>File Viewer</h2>

            {fileLoading && <p>Loading file contents...</p>}

            {fileError && (
              <div style={{ padding: "10px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px" }}>
                {fileError}
              </div>
            )}

            {selectedFile && !fileLoading && !fileError && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                <div style={{ marginBottom: "1rem", padding: "8px", backgroundColor: "#f0f0f0", borderRadius: "4px", fontWeight: "bold" }}>
                  {selectedFile.path}
                </div>
                <div style={{ flex: 1, overflow: "auto", background: "#282c34", color: "#abb2bf", borderRadius: "4px", padding: "1rem" }}>
                  <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "14px", whiteSpace: "pre", overflowX: "auto" }}>
                    {selectedFile.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
