export function bugReportPrompt(text: string): string {
  return `You are a QA engineer writing a structured bug report. Convert the text below into a professional bug report.

Use this exact format:

**Summary:** [One-line description of the bug]

**Environment:** [Infer if possible, otherwise write "Not specified"]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Actual Result:**
[What actually happened]

**Expected Result:**
[What should have happened]

**Severity:** [Critical / High / Medium / Low — infer from context]

Rules:
- Be specific and technical
- Infer missing information from context where reasonable
- Return ONLY the bug report with no meta-commentary

Text to convert:
${text}`;
}
