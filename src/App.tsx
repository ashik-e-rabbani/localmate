import { useState, useCallback, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ResultPanel, ActionType } from "./components/ResultPanel";
import { SettingsScreen } from "./components/SettingsScreen";
import { generateText } from "./services/ollama";
import { readClipboard } from "./services/clipboard";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useOllamaHealth } from "./hooks/useOllamaHealth";
import { useWindowCollapse } from "./hooks/useWindowCollapse";
import { ACTIONS, buildPrompt, Screen } from "./constants/actions";
import appIcon from "./assets/icon-32.png";
import "./index.css";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [inputText, setInputText] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userText, setUserText] = useState("");
  const abortRef = useRef<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ollamaOnline = useOllamaHealth();

  const {
    isCollapsed,
    setIsCollapsed,
    isPinned,
    setIsPinned,
    resizeError,
    handleMouseDownPos,
    expandPanel,
    handleShellMouseEnter,
    startCollapseTimer,
  } = useWindowCollapse(screen, isDone);

  const runAction = useCallback(async (action: ActionType, text?: string) => {
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
    setIsCollapsed(false);

    const prompt = buildPrompt(action, resolvedText);

    await generateText(
      prompt,
      (chunk) => { if (!abortRef.current) setStreamingText((prev) => prev + chunk); },
      (_full) => { if (!abortRef.current) setIsDone(true); },
      (err)   => { if (!abortRef.current) { setError(err); setIsDone(true); } }
    );
  }, [userText]);

  useGlobalShortcuts(useCallback((action: ActionType) => runAction(action), [runAction]));

  const handleBack = () => {
    abortRef.current = true;
    setScreen("menu");
    setStreamingText("");
    setError(null);
    setIsDone(false);
    setActiveAction(null);
  };

  const handleRetry = () => {
    if (activeAction && inputText) runAction(activeAction, inputText);
  };

  return (
    <div
      className={`app-shell ${isCollapsed && !isPinned ? "collapsed" : ""}`}
      onMouseEnter={handleShellMouseEnter}
      onMouseLeave={startCollapseTimer}
    >
      {/* Floating handle — visible only when collapsed */}
      <div
        className="floating-handle"
        onMouseDown={(e) => { handleMouseDownPos.current = { x: e.screenX, y: e.screenY }; }}
        onClick={(e) => {
          const down = handleMouseDownPos.current;
          if (down && (Math.abs(e.screenX - down.x) > 4 || Math.abs(e.screenY - down.y) > 4)) return;
          expandPanel();
        }}
        data-tauri-drag-region
      >
        <img src={appIcon} alt="LocalMate" className="floating-handle-icon" />
        {resizeError && (
          <div style={{ position: "absolute", top: "100%", left: 0, background: "red", color: "white", fontSize: "10px", width: "200px", zIndex: 9999 }}>
            {resizeError}
          </div>
        )}
      </div>

      <div className="shell-main-content">
        {/* Header */}
        <div className="app-header" data-tauri-drag-region>
          <div className="header-icon">
            <img src={appIcon} alt="LocalMate" className="header-icon-img" />
          </div>
          <div className="header-info">
            <div className="header-title">LocalMate</div>
            <div className="header-subtitle">Your LLM Assistant</div>
          </div>
          <button
            className={`header-pin-btn ${isPinned ? "pinned" : ""}`}
            onClick={(e) => { e.stopPropagation(); setIsPinned(!isPinned); }}
            title={isPinned ? "Unpin panel (enable auto-hide)" : "Pin panel (disable auto-hide)"}
          >
            📌
          </button>
          <button
            className="header-minimize-btn"
            onClick={(e) => { e.stopPropagation(); setIsCollapsed(true); }}
            title="Minimize to handle"
          >
            ⎯
          </button>
          <div
            className={`header-status ${ollamaOnline ? "" : "offline"}`}
            title={ollamaOnline ? "Ollama connected" : "Ollama offline"}
          />
        </div>

        {/* Menu */}
        <div className="app-content">
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
                onClick={() => { setUserText(""); textareaRef.current?.focus(); }}
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
              <div className={`action-icon ${action.iconClass}`}>{action.icon}</div>
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
            <div className="action-icon" style={{ background: "rgba(255,255,255,0.05)" }}>⚙️</div>
            <span className="action-label">Settings</span>
          </button>

          <button
            id="btn-quit"
            className="action-btn quit-btn"
            onClick={() => getCurrentWindow().destroy()}
          >
            <div className="action-icon icon-quit">⏻</div>
            <span className="action-label">Quit App</span>
          </button>
        </div>
      </div>

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

      {screen === "settings" && (
        <SettingsScreen onClose={() => setScreen("menu")} />
      )}
    </div>
  );
}
