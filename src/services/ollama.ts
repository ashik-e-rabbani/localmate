export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

export interface OllamaChunk {
  response: string;
  done: boolean;
}

const ENV_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || "llama3.2";
const DEFAULT_TEMPERATURE = import.meta.env.VITE_DEFAULT_TEMPERATURE || "0.3";

function getBaseUrl(): string {
  return localStorage.getItem("LocalMate_serverUrl") || ENV_BASE_URL;
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_current_date",
      description:
        "Get the current date and day of the week. Use this when generating standup notes or any content where today's date is relevant.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "web_fetch",
      description:
        "Fetch the text content of a web page. Use this when the user's text references a URL that you need to read for context.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to fetch" },
        },
        required: ["url"],
      },
    },
  },
];

async function executeTool(
  name: string,
  args: Record<string, string>
): Promise<string> {
  switch (name) {
    case "get_current_date": {
      return new Date().toLocaleDateString("en-AU", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    case "web_fetch": {
      try {
        const res = await fetch(args.url, { signal: AbortSignal.timeout(8000) });
        const text = await res.text();
        const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        return stripped.slice(0, 4000);
      } catch (e) {
        return `Failed to fetch ${args.url}: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

type Message = {
  role: string;
  content: string;
  tool_calls?: Array<{ function: { name: string; arguments: Record<string, string> } }>;
};

export async function generateText(
  prompt: string,
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: string) => void,
  model?: string
): Promise<void> {
  const selectedModel = model || localStorage.getItem("LocalMate_model") || DEFAULT_MODEL;
  const temperature = parseFloat(
    localStorage.getItem("LocalMate_temperature") || DEFAULT_TEMPERATURE
  );
  const toolsEnabled = localStorage.getItem("LocalMate_toolsEnabled") !== "false";

  const messages: Message[] = [{ role: "user", content: prompt }];
  let fullText = "";

  try {
    // Tool-use loop: re-request after each tool execution until no more tool calls
    while (true) {
      const response = await fetch(`${getBaseUrl()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          tools: toolsEnabled ? TOOLS : undefined,
          stream: true,
          options: { temperature },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama error ${response.status}: ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let toolCalls: Message["tool_calls"] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            const content: string = chunk.message?.content;
            if (content) {
              assistantContent += content;
              fullText += content;
              onChunk(content);
            }
            // Tool calls can appear mid-stream or on the done chunk
            if (chunk.message?.tool_calls) {
              toolCalls = chunk.message.tool_calls;
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }

      if (!toolCalls || toolCalls.length === 0) {
        onDone(fullText.trim());
        return;
      }

      // Add assistant message, then execute each tool and append results
      messages.push({ role: "assistant", content: assistantContent, tool_calls: toolCalls });
      for (const tc of toolCalls) {
        const result = await executeTool(tc.function.name, tc.function.arguments || {});
        messages.push({ role: "tool", content: result });
      }
      // Loop: send updated messages back so the model can use the tool results
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onError(msg);
  }
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listModels(baseUrl?: string): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl ?? getBaseUrl()}/api/tags`);
    const data = await res.json();
    return (data.models || []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
}
