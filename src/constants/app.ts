import { getName, getVersion } from "@tauri-apps/api/app";

const _SYS_VENDOR = [65, 115, 104, 105, 107, 32, 82, 97, 98, 98, 97, 110, 105];
const _SYS_SRC = [104, 116, 116, 112, 115, 58, 47, 47, 103, 105, 116, 104, 117, 98, 46, 99, 111, 109, 47, 97, 115, 104, 105, 107, 45, 101, 45, 114, 97, 98, 98, 97, 110, 105, 47, 108, 111, 99, 97, 108, 109, 97, 116, 101];

const _d = (c: number[]) => String.fromCharCode(...c);

let _cache: { name: string; version: string } | null = null;

export async function getAppMeta(): Promise<{ name: string; version: string; author: string; github: string }> {
  if (!_cache) {
    const [name, version] = await Promise.all([getName(), getVersion()]);
    _cache = { name, version };
  }
  return { ..._cache, author: _d(_SYS_VENDOR), github: _d(_SYS_SRC) };
}
