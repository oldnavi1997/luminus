"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

function getCookieConsent(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)luminus_cookie_consent=([^;]*)/);
  return match ? match[1] : null;
}

export function AnalyticsProvider() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    setConsent(getCookieConsent());
    const handler = () => setConsent(getCookieConsent());
    window.addEventListener("luminus:cookie-consent", handler);
    return () => window.removeEventListener("luminus:cookie-consent", handler);
  }, []);

  if (consent !== "accepted") return null;
  return <Analytics />;
}
