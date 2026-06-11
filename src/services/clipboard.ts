import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";

export async function readClipboard(): Promise<string> {
  try {
    const text = await readText();
    return text ?? "";
  } catch (err) {
    console.error("Failed to read clipboard:", err);
    return "";
  }
}

export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to write clipboard:", err);
    return false;
  }
}
