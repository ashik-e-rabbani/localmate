export function rewritePrompt(text: string): string {
  return `You are a professional writing editor. Rewrite the text below to be clearer, more concise, and more engaging.

Rules:
- Preserve the core meaning and key information
- Improve clarity and flow
- Remove redundancy
- Use active voice where possible
- Return ONLY the rewritten text with no explanations, no preamble, no quotes

Text to rewrite:
${text}`;
}
