import { useCallback } from "react";
import { useActivityStore } from "../store/activity-store.ts";
import "./HeaderBar.css";

function formatDate(date: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function HeaderBar() {
  const status = useActivityStore((s) => s.status);
  const metadata = useActivityStore((s) => s.metadata);
  const reset = useActivityStore((s) => s.reset);

  const handleReplace = useCallback(() => {
    reset();
  }, [reset]);

  if (status !== "loaded" || metadata === null) {
    return null;
  }

  return (
    <header className="header-bar">
      <div className="header-bar__meta">
        <span>{metadata.device}</span>
        <span className="header-bar__separator">&middot;</span>
        <span>{formatDate(metadata.date)}</span>
        <span className="header-bar__separator">&middot;</span>
        <span>{capitalize(metadata.sport)}</span>
        <span className="header-bar__separator">&middot;</span>
        <span>{formatDuration(metadata.duration)}</span>
      </div>
      <button
        className="header-bar__replace"
        onClick={handleReplace}
        type="button"
      >
        Replace
      </button>
    </header>
  );
}
