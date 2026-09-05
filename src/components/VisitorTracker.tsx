"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Drop this once near the root layout. Logs a page_view on first load and
 * whenever the site's own client-side router (setView() in site.js) changes
 * the visible section -- listens for the "ja:view-changed" custom event that
 * site.js dispatches (see the small hook added at the bottom of site.js). */
export function VisitorTracker() {
  useEffect(() => {
    track("page_view", { view: window.location.hash || "home" });

    const handler = (e: Event) => {
      const view = (e as CustomEvent<{ view: string }>).detail?.view;
      track("page_view", { view });
    };
    window.addEventListener("ja:view-changed", handler);
    return () => window.removeEventListener("ja:view-changed", handler);
  }, []);

  return null;
}
