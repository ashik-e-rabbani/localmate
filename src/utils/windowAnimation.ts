import { getCurrentWindow, LogicalSize, LogicalPosition } from "@tauri-apps/api/window";

export const EXPANDED_WIDTH = 300;
export const EXPANDED_HEIGHT = 500;
export const COLLAPSED_WIDTH = 40;
export const COLLAPSED_HEIGHT = 40;

export type WinRect = { w: number; h: number; x: number; y: number };

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));

export async function animateWindow(
  win: ReturnType<typeof getCurrentWindow>,
  from: WinRect,
  to: WinRect,
  duration: number,
  ease: (t: number) => number,
  genRef: { current: number },
  gen: number
): Promise<void> {
  const startTime = performance.now();

  while (true) {
    if (genRef.current !== gen) return;

    const progress = Math.min((performance.now() - startTime) / duration, 1);
    const t = ease(progress);

    await Promise.all([
      win.setSize(new LogicalSize(
        Math.round(from.w + (to.w - from.w) * t),
        Math.round(from.h + (to.h - from.h) * t)
      )),
      win.setPosition(new LogicalPosition(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t
      )),
    ]);

    if (progress >= 1) break;
    await nextFrame();
  }
}
