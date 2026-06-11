export function grammarPrompt(text: string): string {
  return `You are a professional grammar editor. Fix any grammar, spelling, and punctuation errors in the text below.

Rules:
- Preserve the original meaning exactly
- Keep the same tone and style
- Only fix errors, do not rephrase unnecessarily
- Return ONLY the corrected text with no explanations, no preamble, no quotes

Text to fix:
${text}`;
}
