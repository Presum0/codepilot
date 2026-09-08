import { useEffect, useState } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

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

  return (
    <div>
      <h1>CodePilot</h1>
      <p>Backend: {backendStatus}</p>
    </div>
  );
}

export default App;
