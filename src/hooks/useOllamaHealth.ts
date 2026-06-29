import { useState, useEffect } from "react";
import { checkOllamaHealth } from "../services/ollama";

export function useOllamaHealth(): boolean {
  const [ollamaOnline, setOllamaOnline] = useState(false);

  useEffect(() => {
    const check = async () => {
      const ok = await checkOllamaHealth();
      setOllamaOnline(ok);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return ollamaOnline;
}
