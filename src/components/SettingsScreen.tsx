import React, { useState, useEffect } from "react";
import { listModels } from "../services/ollama";
import { getAppMeta } from "../constants/app";

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const [serverUrl, setServerUrl] = useState(
    localStorage.getItem("LocalMate_serverUrl") || import.meta.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434"
  );
  const [model, setModel] = useState(
    localStorage.getItem("LocalMate_model") || import.meta.env.VITE_DEFAULT_MODEL || "llama3.2"
  );
  const [temperature, setTemperature] = useState(
    localStorage.getItem("LocalMate_temperature") || import.meta.env.VITE_DEFAULT_TEMPERATURE || "0.3"
  );
  const [toolsEnabled, setToolsEnabled] = useState(
    localStorage.getItem("LocalMate_toolsEnabled") !== "false"
  );
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [appMeta, setAppMeta] = useState<{ name: string; version: string; author: string } | null>(null);
  const [versionTaps, setVersionTaps] = useState(0);
  const [showAuthor, setShowAuthor] = useState(false);

  useEffect(() => {
    getAppMeta().then(setAppMeta);
  }, []);

  const handleVersionClick = () => {
    const next = versionTaps + 1;
    setVersionTaps(next);
    if (next >= 3) {
      setShowAuthor(true);
      setVersionTaps(0);
    }
  };

  const handleLoadModels = async () => {
    setLoadingModels(true);
    const list = await listModels(serverUrl);
    setModels(list);
    setLoadingModels(false);
  };

  const handleSave = () => {
    localStorage.setItem("LocalMate_serverUrl", serverUrl);
    localStorage.setItem("LocalMate_model", model);
    localStorage.setItem("LocalMate_temperature", temperature);
    localStorage.setItem("LocalMate_toolsEnabled", String(toolsEnabled));
    onClose();
  };

  return (
    <div className="settings-screen">
      <div className="result-header" data-tauri-drag-region>
        <button className="result-back-btn" onClick={onClose} title="Close">
          ←
        </button>
        <span className="result-title">Settings</span>
        <span style={{ fontSize: "14px" }}>⚙️</span>
      </div>

      <div className="settings-body">
        <div className="settings-group">
          <label className="settings-label">Server URL</label>
          <input
            className="settings-input"
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://localhost:11434"
          />
        </div>

        <div className="settings-group">
          <label className="settings-label">Ollama Model</label>
          <input
            className="settings-input"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. llama3.2"
          />
          {models.length > 0 && (
            <select
              className="settings-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn-secondary"
            onClick={handleLoadModels}
            disabled={loadingModels}
            style={{ marginTop: "2px" }}
          >
            {loadingModels ? "Loading…" : "↻ Load available models"}
          </button>
        </div>

        <div className="settings-group">
          <label className="settings-label">
            Temperature: {temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            style={{ width: "100%", accentColor: "var(--accent-primary)" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "9px",
              color: "var(--text-muted)",
            }}
          >
            <span>Precise (0)</span>
            <span>Creative (1)</span>
          </div>
        </div>

        <div className="settings-group">
          <label className="settings-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Tool Use</span>
            <input
              type="checkbox"
              checked={toolsEnabled}
              onChange={(e) => setToolsEnabled(e.target.checked)}
              style={{ width: "auto", accentColor: "var(--accent-primary)", cursor: "pointer" }}
            />
          </label>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
            Enables date & web-fetch tools. Requires a model that supports tool calling (llama3.1, llama3.2, qwen2.5, mistral-nemo).
          </div>
        </div>

      </div>

      {appMeta && (
        <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
          <span
            onClick={handleVersionClick}
            style={{ fontSize: "10px", color: "var(--text-muted)", cursor: "default", userSelect: "none" }}
          >
            {appMeta.name} v{appMeta.version}
          </span>
          {showAuthor && (
            <div style={{ fontSize: "10px", color: "var(--accent-primary)", marginTop: "2px" }}>
              By {appMeta.author}
            </div>
          )}
        </div>
      )}

      <div className="settings-footer">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn-copy"
          onClick={handleSave}
          style={{ flex: 1 }}
        >
          ✓ Save
        </button>
      </div>
    </div>
  );
};
