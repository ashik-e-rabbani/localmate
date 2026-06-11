export function standupPrompt(text: string): string {
  return `You are a software engineer writing a daily standup update. Rewrite the text below as a professional standup update.

Format:
✅ Yesterday: [what was completed]
🔨 Today: [what will be worked on]
🚧 Blockers: [any blockers, or "None"]

Rules:
- Keep it brief and professional
- Use past tense for yesterday, present/future for today
- If blocker info is not available, write "None"
- Infer the appropriate sections from the context given
- Return ONLY the formatted standup update with no meta-commentary

Text to convert:
${text}`;
}
