export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

export interface OllamaChunk {
  response: string;
  done: boolean;
}

const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || "llama3.2";
const DEFAULT_TEMPERATURE = import.meta.env.VITE_DEFAULT_TEMPERATURE || "0.3";

export async function generateText(
  prompt: string,
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: string) => void,
  model?: string
): Promise<void> {
  const selectedModel =
    model || localStorage.getItem("LocalMate_model") || DEFAULT_MODEL;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        prompt,
        stream: true,
        options: {
          temperature: parseFloat(
            localStorage.getItem("LocalMate_temperature") || DEFAULT_TEMPERATURE
          ),
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama error ${response.status}: ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk: OllamaChunk = JSON.parse(line);
          if (chunk.response) {
            fullText += chunk.response;
            onChunk(chunk.response);
          }
          if (chunk.done) {
            onDone(fullText.trim());
            return;
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }

    onDone(fullText.trim());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onError(msg);
  }
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    const data = await res.json();
    return (data.models || []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
}
