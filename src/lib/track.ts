"use client";

import { createClient } from "@/lib/supabase/client";

const SESSION_KEY = "ja_visitor_session_id";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Fire-and-forget visitor event logger. Never throws -- tracking failures
 * should never break the user's experience of the site. */
export async function track(eventType: string, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("visitor_events").insert({
      session_id: getSessionId(),
      user_id: user?.id ?? null,
      event_type: eventType,
      page: window.location.pathname,
      metadata,
      user_agent: navigator.userAgent,
    });
  } catch (err) {
    console.warn("Tracking failed (non-fatal):", err);
  }
}
