import { useState, useCallback, useEffect, useRef } from "react";
import { ResultPanel, ActionType } from "./components/ResultPanel";
import { SettingsScreen } from "./components/SettingsScreen";
import { generateText, checkOllamaHealth } from "./services/ollama";
import { readClipboard } from "./services/clipboard";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { grammarPrompt } from "./prompts/grammar";
import { rewritePrompt } from "./prompts/rewrite";
import { jiraPrompt } from "./prompts/jira";
import { standupPrompt } from "./prompts/standup";
import { bugReportPrompt } from "./prompts/bugreport";
import { testCasePrompt } from "./prompts/testcase";
import "./index.css";

type Screen = "menu" | "result" | "settings";

interface Action {
  id: ActionType;
  label: string;
  icon: string;
  iconClass: string;
  shortcut: string;
}

const ACTIONS: Action[] = [
  {
    id: "grammar",
    label: "Fix Grammar",
    icon: "✍️",
    iconClass: "icon-grammar",
    shortcut: "⌘⇧G",
  },
  {
    id: "rewrite",
    label: "Rewrite",
    icon: "🔄",
    iconClass: "icon-rewrite",
    shortcut: "⌘⇧R",
  },
  {
    id: "jira",
    label: "Jira Style",
    icon: "📋",
    iconClass: "icon-jira",
    shortcut: "⌘⇧J",
  },
  {
    id: "standup",
    label: "Standup",
    icon: "📅",
    iconClass: "icon-standup",
    shortcut: "⌘⇧S",
  },
  {
    id: "bugreport",
    label: "Bug Report",
    icon: "🐛",
    iconClass: "icon-bug",
    shortcut: "⌘⇧B",
  },
  {
    id: "testcase",
    label: "Test Case",
    icon: "🧪",
    iconClass: "icon-test",
    shortcut: "⌘⇧T",
  },
];

function buildPrompt(action: ActionType, text: string): string {
  switch (action) {
    case "grammar":
      return grammarPrompt(text);
    case "rewrite":
      return rewritePrompt(text);
    case "jira":
      return jiraPrompt(text);
    case "standup":
      return standupPrompt(text);
    case "bugreport":
      return bugReportPrompt(text);
    case "testcase":
      return testCasePrompt(text);
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [inputText, setInputText] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const abortRef = useRef<boolean>(false);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem("LocalMate_pinned");
    return saved ? JSON.parse(saved) : false;
  });
  const collapseTimeoutRef = useRef<any>(null);

  // sync pin preference to localStorage
  useEffect(() => {
    localStorage.setItem("LocalMate_pinned", JSON.stringify(isPinned));
  }, [isPinned]);

  const expandPanel = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsCollapsed(false);
  }, []);

  const handleShellMouseEnter = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  }, []);

  const startCollapseTimer = useCallback(() => {
    if (isPinned) return;
    if (screen === "result" && !isDone) return;

    // Prevent collapse if an input/textarea is currently focused
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      return;
    }

    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    collapseTimeoutRef.current = setTimeout(() => {
      setIsCollapsed(true);
    }, 800);
  }, [isPinned, screen, isDone]);

  // Health check on mount and every 10s
  useEffect(() => {
    const check = async () => {
      const ok = await checkOllamaHealth();
      setOllamaOnline(ok);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const runAction = useCallback(async (action: ActionType, text?: string) => {
    const clipboardText = text ?? (await readClipboard());
    if (!clipboardText.trim()) {
      setActiveAction(action);
      setInputText("");
      setStreamingText("");
      setError("Clipboard is empty. Copy some text first, then try again.");
      setIsDone(true);
      setScreen("result");
      setIsCollapsed(false);
      return;
    }

    abortRef.current = false;
    setActiveAction(action);
    setInputText(clipboardText);
    setStreamingText("");
    setError(null);
    setIsDone(false);
    setScreen("result");
    setIsCollapsed(false); // Expand to show streaming progress

    const prompt = buildPrompt(action, clipboardText);

    await generateText(
      prompt,
      (chunk) => {
        if (abortRef.current) return;
        setStreamingText((prev) => prev + chunk);
      },
      (_full) => {
        if (!abortRef.current) setIsDone(true);
      },
      (err) => {
        if (!abortRef.current) {
          setError(err);
          setIsDone(true);
        }
      }
    );
  }, []);

  const handleShortcut = useCallback(
    (action: ActionType) => {
      runAction(action);
    },
    [runAction]
  );

  useGlobalShortcuts(handleShortcut);

  const handleBack = () => {
    abortRef.current = true;
    setScreen("menu");
    setStreamingText("");
    setError(null);
    setIsDone(false);
    setActiveAction(null);
  };

  const handleRetry = () => {
    if (activeAction && inputText) {
      runAction(activeAction, inputText);
    }
  };

  return (
    <div
      className={`app-shell ${isCollapsed && !isPinned ? "collapsed" : ""}`}
      onMouseEnter={handleShellMouseEnter}
      onMouseLeave={startCollapseTimer}
    >
      {/* Floating Handle — visible only when collapsed */}
      <div
        className="floating-handle"
        onClick={expandPanel}
        onMouseEnter={expandPanel}
      >
        <span className="floating-handle-icon">✨</span>
      </div>

      <div className="shell-main-content">
        {/* Header — always visible as base layer */}
        <div className="app-header" data-tauri-drag-region>
          <div className="header-icon">✨</div>
          <div className="header-info">
            <div className="header-title">LocalMate</div>
            <div className="header-subtitle">Local Writing Assistant</div>
          </div>

          <button
            className={`header-pin-btn ${isPinned ? "pinned" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsPinned(!isPinned);
            }}
            title={isPinned ? "Unpin panel (enable auto-hide)" : "Pin panel (disable auto-hide)"}
          >
            📌
          </button>

          <div
            className={`header-status ${ollamaOnline ? "" : "offline"}`}
            title={ollamaOnline ? "Ollama connected" : "Ollama offline"}
          />
        </div>

        {/* Main menu content */}
        <div className="app-content">
          <div className="clipboard-hint">
            <span>📋</span>
            <span>Copy text, then click an action or use a shortcut</span>
          </div>

          <div className="section-label">Actions</div>

          {ACTIONS.map((action) => (
            <button
              key={action.id}
              id={`action-${action.id}`}
              className="action-btn"
              onClick={() => runAction(action.id)}
              disabled={!ollamaOnline}
              title={`${action.label} (${action.shortcut})`}
            >
              <div className={`action-icon ${action.iconClass}`}>
                {action.icon}
              </div>
              <span className="action-label">{action.label}</span>
              <span className="action-shortcut">{action.shortcut}</span>
            </button>
          ))}

          <div className="section-divider" />

          <button
            id="btn-settings"
            className="action-btn"
            onClick={() => setScreen("settings")}
            style={{ marginTop: "auto" }}
          >
            <div className="action-icon" style={{ background: "rgba(255,255,255,0.05)" }}>
              ⚙️
            </div>
            <span className="action-label">Settings</span>
          </button>
        </div>

        {/* Result overlay */}
        {screen === "result" && activeAction && (
          <ResultPanel
            action={activeAction}
            inputText={inputText}
            streamingText={streamingText}
            isDone={isDone}
            error={error}
            onBack={handleBack}
            onRetry={handleRetry}
          />
        )}

        {/* Settings overlay */}
        {screen === "settings" && (
          <SettingsScreen onClose={() => setScreen("menu")} />
        )}
      </div>
    </div>
  );
}
