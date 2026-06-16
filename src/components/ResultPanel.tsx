import React, { useState, useEffect, useRef } from "react";
import { writeClipboard } from "../services/clipboard";
import { LoadingSpinner } from "./LoadingSpinner";

export type ActionType =
  | "grammar"
  | "rewrite"
  | "jira"
  | "standup"
  | "bugreport"
  | "testcase";

interface ResultPanelProps {
  action: ActionType;
  inputText: string;
  streamingText: string;
  isDone: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
}

const ACTION_LABELS: Record<ActionType, string> = {
  grammar: "Improve Writing",
  rewrite: "Rewrite",
  jira: "Jira Style",
  standup: "Standup",
  bugreport: "Jira Ticket",
  testcase: "Test Case",
};

export const ResultPanel: React.FC<ResultPanelProps> = ({
  action,
  streamingText,
  isDone,
  error,
  onBack,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [streamingText]);

  const handleCopy = async () => {
    if (!streamingText) return;
    const ok = await writeClipboard(streamingText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="result-panel">
      <div className="result-header" data-tauri-drag-region>
        <button className="result-back-btn" onClick={onBack} title="Back">
          ←
        </button>
        <span className="result-title">{ACTION_LABELS[action]}</span>
        {isDone && !error && (
          <span className="result-badge badge-done">Done</span>
        )}
        {!isDone && !error && (
          <span className="result-badge badge-working">Working</span>
        )}
      </div>

      <div className="result-body" ref={bodyRef}>
        {error ? (
          <div className="error-text">⚠️ {error}</div>
        ) : !streamingText && !isDone ? (
          <LoadingSpinner />
        ) : (
          <div className="result-text">
            {streamingText}
            {!isDone && <span className="cursor-blink" />}
          </div>
        )}
      </div>

      <div className="result-footer">
        {error ? (
          <>
            <button className="btn-secondary" onClick={onBack}>
              ← Back
            </button>
            <button className="btn-copy" onClick={onRetry}>
              ↺ Retry
            </button>
          </>
        ) : (
          <>
            <button className="btn-secondary" onClick={onBack} title="Back">
              ←
            </button>
            <button
              className={`btn-copy ${copied ? "copied" : ""}`}
              onClick={handleCopy}
              disabled={!isDone || !streamingText}
            >
              {copied ? "✓ Copied!" : "⎘ Copy"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
