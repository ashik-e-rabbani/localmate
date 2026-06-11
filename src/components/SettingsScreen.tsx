import React, { useState } from "react";
import { listModels } from "../services/ollama";

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const [model, setModel] = useState(
    localStorage.getItem("LocalMate_model") || "qwen3:8b"
  );
  const [temperature, setTemperature] = useState(
    localStorage.getItem("LocalMate_temperature") || "0.3"
  );
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const handleLoadModels = async () => {
    setLoadingModels(true);
    const list = await listModels();
    setModels(list);
    setLoadingModels(false);
  };

  const handleSave = () => {
    localStorage.setItem("LocalMate_model", model);
    localStorage.setItem("LocalMate_temperature", temperature);
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
          <label className="settings-label">Ollama Model</label>
          <input
            className="settings-input"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. qwen3:8b"
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
          <label className="settings-label">Shortcuts</label>
          <div className="clipboard-hint">
            <span>⌨️</span>
            <span>
              ⌘⇧G Grammar · ⌘⇧R Rewrite · ⌘⇧J Jira · ⌘⇧S Standup · ⌘⇧B Bug · ⌘⇧T Test
            </span>
          </div>
        </div>
      </div>

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
