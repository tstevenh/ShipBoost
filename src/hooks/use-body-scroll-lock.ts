"use client";

import { useEffect } from "react";

// Tracks how many modals are currently locking scroll, so nested/stacked modals
// don't accidentally restore overflow before the outermost closes.
let lockCount = 0;
let savedOverflow: string | null = null;

export function useBodyScrollLock(active: boolean = true) {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = savedOverflow ?? "";
        savedOverflow = null;
      }
    };
  }, [active]);
}
