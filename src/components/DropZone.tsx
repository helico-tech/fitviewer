import { useState, useCallback, useRef } from "react";
import { useActivityStore } from "../store/activity-store.ts";
import { ErrorDisplay } from "./ErrorDisplay.tsx";
import "./DropZone.css";

type DropZoneProps = {
  onFile: (file: File) => void;
};

export function DropZone({ onFile }: DropZoneProps) {
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const error = useActivityStore((s) => s.error);
  const status = useActivityStore((s) => s.status);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setActive(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setActive(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        onFile(file);
      }
    },
    [onFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFile(file);
      }
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [onFile],
  );

  const handleButtonClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div
      className={`drop-zone ${active ? "drop-zone--active" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="drop-zone__content">
        <h1 className="drop-zone__headline">
          Drop your FIT file to launch telemetry
        </h1>
        <p className="drop-zone__tagline">
          Drag a .fit file from your watch export, or use the button below
        </p>

        <button
          className="drop-zone__picker"
          onClick={handleButtonClick}
          type="button"
        >
          Choose FIT File
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".fit"
          className="drop-zone__input"
          onChange={handleFileSelect}
        />

        {status === "error" && error && (
          <ErrorDisplay message={error.message} details={error.details} />
        )}
      </div>
    </div>
  );
}
