import { useEffect } from "react";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";

export type ShortcutAction =
  | "grammar"
  | "rewrite"
  | "jira"
  | "standup"
  | "bugreport"
  | "testcase";

interface ShortcutMap {
  [key: string]: ShortcutAction;
}

const SHORTCUTS: ShortcutMap = {
  "CommandOrControl+Shift+G": "grammar",
  "CommandOrControl+Shift+R": "rewrite",
  "CommandOrControl+Shift+J": "jira",
  "CommandOrControl+Shift+S": "standup",
  "CommandOrControl+Shift+B": "bugreport",
  "CommandOrControl+Shift+T": "testcase",
};

export function useGlobalShortcuts(
  onAction: (action: ShortcutAction) => void
) {
  useEffect(() => {
    let registered = false;

    const setup = async () => {
      try {
        for (const [shortcut, action] of Object.entries(SHORTCUTS)) {
          await register(shortcut, () => {
            onAction(action);
          });
        }
        registered = true;
      } catch (err) {
        console.warn("Global shortcuts not available:", err);
      }
    };

    setup();

    return () => {
      if (registered) {
        unregisterAll().catch(console.warn);
      }
    };
  }, [onAction]);
}
