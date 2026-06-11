export function jiraPrompt(text: string): string {
  return `You are a professional software engineer writing a Jira ticket comment. Rewrite the text below as a clear, professional Jira comment.

Rules:
- Use professional, concise language
- Structure clearly with context and any action items
- Fix any grammar or spelling issues
- Keep it factual and task-focused
- Return ONLY the formatted Jira comment with no meta-commentary, no quotes

Text to convert:
${text}`;
}
