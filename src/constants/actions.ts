import { ActionType } from "../components/ResultPanel";
import { grammarPrompt } from "../prompts/grammar";
import { rewritePrompt } from "../prompts/rewrite";
import { jiraPrompt } from "../prompts/jira";
import { standupPrompt } from "../prompts/standup";
import { bugReportPrompt } from "../prompts/bugreport";
import { testCasePrompt } from "../prompts/testcase";

export type Screen = "menu" | "result" | "settings";

export interface Action {
  id: ActionType;
  label: string;
  icon: string;
  iconClass: string;
  shortcut: string;
}

export const ACTIONS: Action[] = [
  { id: "grammar",   label: "Improve",       icon: "✍️",  iconClass: "icon-grammar",  shortcut: "⌘⇧G" },
  { id: "rewrite",   label: "Rewrite",        icon: "🔄",  iconClass: "icon-rewrite",  shortcut: "⌘⇧R" },
  { id: "standup",   label: "Standup Notes",  icon: "📅",  iconClass: "icon-standup",  shortcut: "⌘⇧S" },
  { id: "bugreport", label: "Jira Ticket",    icon: "🐛",  iconClass: "icon-bug",      shortcut: "⌘⇧B" },
  { id: "testcase",  label: "Test Case",      icon: "🧪",  iconClass: "icon-test",     shortcut: "⌘⇧T" },
];

export function buildPrompt(action: ActionType, text: string): string {
  switch (action) {
    case "grammar":   return grammarPrompt(text);
    case "rewrite":   return rewritePrompt(text);
    case "jira":      return jiraPrompt(text);
    case "standup":   return standupPrompt(text);
    case "bugreport": return bugReportPrompt(text);
    case "testcase":  return testCasePrompt(text);
  }
}
