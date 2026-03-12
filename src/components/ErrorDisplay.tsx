import { useState, useCallback } from "react";
import "./ErrorDisplay.css";

type ErrorDisplayProps = {
  message: string;
  details?: string;
};

export function ErrorDisplay({ message, details }: ErrorDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleDetails = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div className="error-display">
      <p className="error-display__message">{message}</p>
      {details && (
        <>
          <button
            className="error-display__toggle"
            onClick={toggleDetails}
            type="button"
          >
            {expanded ? "Hide details" : "Show details"}
          </button>
          <div
            className={`error-display__details ${expanded ? "error-display__details--open" : ""}`}
          >
            <pre className="error-display__details-text">{details}</pre>
          </div>
        </>
      )}
    </div>
  );
}
