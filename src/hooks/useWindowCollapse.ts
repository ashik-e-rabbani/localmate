import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import {
  animateWindow,
  easeOutCubic,
  easeInOutCubic,
  EXPANDED_WIDTH,
  EXPANDED_HEIGHT,
  COLLAPSED_WIDTH,
  COLLAPSED_HEIGHT,
  WinRect,
} from "../utils/windowAnimation";
import { Screen } from "../constants/actions";

export function useWindowCollapse(screen: Screen, isDone: boolean) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem("LocalMate_pinned");
    return saved ? JSON.parse(saved) : false;
  });
  const [resizeError, setResizeError] = useState<string | null>(null);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animGenRef = useRef(0);
  const handleMouseDownPos = useRef<{ x: number; y: number } | null>(null);

  // Sync pin preference to localStorage
  useEffect(() => {
    localStorage.setItem("LocalMate_pinned", JSON.stringify(isPinned));
  }, [isPinned]);

  // Animate the Tauri window when collapse state changes
  useEffect(() => {
    const tauriWindow = getCurrentWindow();
    const gen = ++animGenRef.current;

    const run = async () => {
      try {
        const factor = await tauriWindow.scaleFactor();
        if (gen !== animGenRef.current) return;

        const physicalPos = await tauriWindow.outerPosition();
        // @ts-ignore — toLogical exists at runtime but is missing from some type versions
        const pos = typeof physicalPos.toLogical === "function"
          ? physicalPos.toLogical(factor)
          : { x: physicalPos.x / factor, y: physicalPos.y / factor };

        await tauriWindow.setResizable(true);
        await tauriWindow.setMinSize(new LogicalSize(COLLAPSED_WIDTH, COLLAPSED_HEIGHT));

        if (isCollapsed) {
          const from: WinRect = { w: EXPANDED_WIDTH, h: EXPANDED_HEIGHT, x: pos.x, y: pos.y };
          const to: WinRect = {
            w: COLLAPSED_WIDTH,
            h: COLLAPSED_HEIGHT,
            x: pos.x + (EXPANDED_WIDTH - COLLAPSED_WIDTH),
            y: pos.y + (EXPANDED_HEIGHT - COLLAPSED_HEIGHT) / 2,
          };
          await animateWindow(tauriWindow, from, to, 200, easeInOutCubic, animGenRef, gen);
        } else {
          const from: WinRect = { w: COLLAPSED_WIDTH, h: COLLAPSED_HEIGHT, x: pos.x, y: pos.y };
          const to: WinRect = {
            w: EXPANDED_WIDTH,
            h: EXPANDED_HEIGHT,
            x: pos.x - (EXPANDED_WIDTH - COLLAPSED_WIDTH),
            y: pos.y - (EXPANDED_HEIGHT - COLLAPSED_HEIGHT) / 2,
          };
          await animateWindow(tauriWindow, from, to, 200, easeOutCubic, animGenRef, gen);
        }
        setResizeError(null);
      } catch (err: any) {
        setResizeError(err.toString());
        console.error("Failed to resize window:", err);
      }
    };
    run();
  }, [isCollapsed, isPinned]);

  const expandPanel = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsCollapsed(false);
  }, []);

  const handleShellMouseEnter = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  }, []);

  const startCollapseTimer = useCallback(() => {
    if (isPinned) return;
    if (screen === "result" && !isDone) return;

    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) return;

    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    collapseTimeoutRef.current = setTimeout(() => setIsCollapsed(true), 800);
  }, [isPinned, screen, isDone]);

  return {
    isCollapsed,
    setIsCollapsed,
    isPinned,
    setIsPinned,
    resizeError,
    handleMouseDownPos,
    expandPanel,
    handleShellMouseEnter,
    startCollapseTimer,
  };
}
