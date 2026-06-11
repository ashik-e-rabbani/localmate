export function testCasePrompt(text: string): string {
  return `You are a QA engineer writing a structured test case. Convert the text below into a professional test case document.

Use this exact format:

**Test Case ID:** TC-001

**Title:** [Brief title of what is being tested]

**Preconditions:**
- [Precondition 1]
- [Precondition 2]

**Test Steps:**
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | [Action] | [Expected] |
| 2 | [Action] | [Expected] |

**Post-conditions:**
[What should be true after the test]

**Priority:** [High / Medium / Low — infer from context]

Rules:
- Be precise and unambiguous
- Each step should test one action
- Expected results should be verifiable
- Return ONLY the test case with no meta-commentary

Text to convert:
${text}`;
}
