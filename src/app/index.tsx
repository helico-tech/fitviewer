import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function App() {
  return <div>FIT Viewer</div>;
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
