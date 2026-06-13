export function bugReportPrompt(text: string): string {
  return `You are a QA engineer writing a structured Jira Ticket. Convert the text below into a professional bug ticket.

Use this exact format:

**Summary:** [One-line description of the ticket]

**Environment:** [Infer if possible, otherwise write "Not specified", Possible Values are 'Staging', 'Production', 'UAT', 'Local', 'Others']

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Actual Result:**
[What actually happened]

**Expected Result:**
[What should have happened]

**Attachments:** [Infer from context, write "None" if not applicable] 

**Logs:** [Infer from context usually API request, error logs , server logs e.t.c, write "None" if not applicable]

**Priority:** [High / Medium / Low — infer from context]

**Severity:** [Critical / High / Medium / Low — infer from context]

Rules:
- Be specific and technical
- Infer missing information from context where reasonable
- Return ONLY the bug report with no meta-commentary

Text to convert:
${text}`;
}
