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
import { getCurrentWindow, LogicalSize, LogicalPosition } from "@tauri-apps/api/window";
import appIcon from "./assets/icon-32.png";
import "./index.css";

const EXPANDED_WIDTH = 300;
const EXPANDED_HEIGHT = 320;
const COLLAPSED_WIDTH = 48;
const COLLAPSED_HEIGHT = 60;

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
    label: "Improve",
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
  }
  ,
  {
    id: "standup",
    label: "Standup Notes",
    icon: "📅",
    iconClass: "icon-standup",
    shortcut: "⌘⇧S",
  },
  {
    id: "bugreport",
    label: "Jira Ticket",
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
  const [userText, setUserText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem("LocalMate_pinned");
    return saved ? JSON.parse(saved) : false;
  });
  const collapseTimeoutRef = useRef<any>(null);
  const isResizingRef = useRef(false);
  const windowPosRef = useRef<{ x: number; y: number } | null>(null);

  // sync pin preference to localStorage
  useEffect(() => {
    localStorage.setItem("LocalMate_pinned", JSON.stringify(isPinned));
  }, [isPinned]);

  // Resize the actual Tauri window when collapse state changes
  useEffect(() => {
    const tauriWindow = getCurrentWindow();
    const resizeWindow = async () => {
      if (isResizingRef.current) return;
      isResizingRef.current = true;
      try {
        if (isCollapsed && !isPinned) {
          // Save current position before collapsing
          const pos = await tauriWindow.outerPosition();
          windowPosRef.current = { x: pos.x, y: pos.y };
          // Move window right so the collapsed handle stays at the right edge
          const newX = pos.x + (EXPANDED_WIDTH - COLLAPSED_WIDTH);
          await tauriWindow.setSize(new LogicalSize(COLLAPSED_WIDTH, COLLAPSED_HEIGHT));
          await tauriWindow.setPosition(new LogicalPosition(newX, pos.y + (EXPANDED_HEIGHT - COLLAPSED_HEIGHT) / 2));
        } else {
          // Restore expanded size
          if (windowPosRef.current) {
            await tauriWindow.setPosition(new LogicalPosition(windowPosRef.current.x, windowPosRef.current.y));
          }
          await tauriWindow.setSize(new LogicalSize(EXPANDED_WIDTH, EXPANDED_HEIGHT));
        }
      } finally {
        isResizingRef.current = false;
      }
    };
    resizeWindow();
  }, [isCollapsed, isPinned]);

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
    // Priority: explicit text arg > userText from textarea > clipboard
    const resolvedText = text ?? (userText.trim() ? userText : await readClipboard());
    if (!resolvedText.trim()) {
      setActiveAction(action);
      setInputText("");
      setStreamingText("");
      setError("No text provided. Type text above or copy some text first, then try again.");
      setIsDone(true);
      setScreen("result");
      setIsCollapsed(false);
      return;
    }

    abortRef.current = false;
    setActiveAction(action);
    setInputText(resolvedText);
    setStreamingText("");
    setError(null);
    setIsDone(false);
    setScreen("result");
    setIsCollapsed(false); // Expand to show streaming progress

    const prompt = buildPrompt(action, resolvedText);

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
  }, [userText]);

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
        <img src={appIcon} alt="LocalMate" className="floating-handle-icon" />
      </div>

      <div className="shell-main-content">
        {/* Header — always visible as base layer */}
        <div className="app-header" data-tauri-drag-region>
          <div className="header-icon"><img src={appIcon} alt="LocalMate" className="header-icon-img" /></div>
          <div className="header-info">
            <div className="header-title">LocalMate</div>
            <div className="header-subtitle">Your LLM Assistant</div>
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

          <button
            className="header-minimize-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(true);
            }}
            title="Minimize to handle"
          >
            ⎯
          </button>

          <div
            className={`header-status ${ollamaOnline ? "" : "offline"}`}
            title={ollamaOnline ? "Ollama connected" : "Ollama offline"}
          />
        </div>

        {/* Main menu content */}
        <div className="app-content">
          {/* Text Input Area */}
          <div className="text-input-container">
            <textarea
              ref={textareaRef}
              className="text-input-area"
              placeholder="Type or paste your text here…"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              rows={3}
            />
            {userText && (
              <button
                className="text-input-clear"
                onClick={() => {
                  setUserText("");
                  textareaRef.current?.focus();
                }}
                title="Clear text"
              >
                ✕
              </button>
            )}
          </div>

          <div className="clipboard-hint">
            <span>📋</span>
            <span>{userText.trim() ? "Text ready — pick an action below" : "Type above, or copy text and use a shortcut"}</span>
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

          <button
            id="btn-quit"
            className="action-btn quit-btn"
            onClick={() => getCurrentWindow().destroy()}
          >
            <div className="action-icon icon-quit">
              ⏻
            </div>
            <span className="action-label">Quit App</span>
          </button>
        </div>
      </div>

      {/* Result overlay — outside shell-main-content to avoid pointer-events: none when collapsed */}
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

      {/* Settings overlay — outside shell-main-content */}
      {screen === "settings" && (
        <SettingsScreen onClose={() => setScreen("menu")} />
      )}
    </div>
  );
}
