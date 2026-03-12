import { useState, useCallback } from "react";
import { useActivityStore } from "../store/activity-store.ts";
import { handleFileUpload } from "../lib/parse-file.ts";
import { DropZone } from "../components/DropZone.tsx";
import { BootSequence } from "../components/BootSequence.tsx";
import { DashboardSkeleton } from "../components/DashboardSkeleton.tsx";
import { HeaderBar } from "../components/HeaderBar.tsx";
import "./App.css";

export function App() {
  const status = useActivityStore((s) => s.status);
  const [showBoot, setShowBoot] = useState(false);

  // When status transitions to 'loading', show the boot sequence
  const prevStatusRef = { current: status };
  if (status === "loading" && !showBoot) {
    setShowBoot(true);
  }
  if (status !== "loading" && status !== "loaded" && showBoot) {
    setShowBoot(false);
  }

  const handleBootComplete = useCallback(() => {
    setShowBoot(false);
  }, []);

  const showDropZone = status === "empty" || status === "error";
  const showBootSequence = status === "loading" && showBoot;
  const showHeader = status === "loaded";

  return (
    <div className="app">
      {/* Dashboard skeleton is always rendered as the background layer */}
      <div className="app__dashboard-layer">
        <DashboardSkeleton />
      </div>

      {/* Header bar appears at top when loaded */}
      {showHeader && (
        <div className="app__header-layer">
          <HeaderBar />
        </div>
      )}

      {/* Drop zone overlays when empty or error */}
      <div
        className={`app__overlay-layer ${showDropZone ? "app__overlay-layer--visible" : "app__overlay-layer--hidden"}`}
      >
        <DropZone onFile={handleFileUpload} />
      </div>

      {/* Boot sequence overlays during loading */}
      {showBootSequence && (
        <div className="app__boot-layer">
          <BootSequence onComplete={handleBootComplete} />
        </div>
      )}
    </div>
  );
}
