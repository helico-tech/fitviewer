import { useState, useEffect, useRef, useCallback } from "react";
import "./BootSequence.css";

const BOOT_MESSAGES = [
  "Initializing telemetry systems...",
  "Calibrating heart rate sensors...",
  "Analyzing stride patterns...",
  "Reticulating splines...",
  "Decoding satellite uplink...",
  "Charging flux capacitors...",
  "Synchronizing pace matrices...",
  "Engaging data visualization core...",
];

const MESSAGE_INTERVAL_MS = 200;
const TOTAL_DURATION_MS = 1500;

type BootSequenceProps = {
  onComplete: () => void;
};

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cycleMessages = useCallback(() => {
    setMessageIndex((prev) => (prev + 1) % BOOT_MESSAGES.length);
  }, []);

  useEffect(() => {
    const cycleTimer = setInterval(cycleMessages, MESSAGE_INTERVAL_MS);
    const doneTimer = setTimeout(() => {
      onCompleteRef.current();
    }, TOTAL_DURATION_MS);

    return () => {
      clearInterval(cycleTimer);
      clearTimeout(doneTimer);
    };
  }, [cycleMessages]);

  return (
    <div className="boot-sequence">
      <div className="boot-sequence__terminal">
        <p className="boot-sequence__message" key={messageIndex}>
          <span className="boot-sequence__cursor">{">"}</span>{" "}
          {BOOT_MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  );
}
