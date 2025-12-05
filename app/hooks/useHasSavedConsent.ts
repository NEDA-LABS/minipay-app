"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";

export function useHasSavedConsent() {
  const { address, getAccessToken, authenticated } = useWallet();
  const [loading, setLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    let active = true;
    async function run() {
      // Only check consent if user is authenticated
      if (!authenticated) {
        if (active) {
          setHasConsent(false);
          setLoading(false);
        }
        return;
      }

      // First check client-side cookie immediately
      try {
        const raw = document.cookie
          .split("; ")
          .find((row) => row.startsWith("nedapay.cookieConsent.v1="))
          ?.split("=")[1];
        if (raw) {
          const parsed = JSON.parse(decodeURIComponent(raw));
          if (active) {
            setHasConsent(true);
            setLoading(false);
          }
          return; // Early return if cookie exists
        }
      } catch {}

      // If no cookie and user is authenticated, check the database
      if (!address) {
        if (active) setLoading(false);
        return;
      }

      try {
        const tk = await getAccessToken();
        const res = await fetch("/api/cookie-consent", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tk}`,
          },
          credentials: "include",
        });
        const json = await res.json();
        if (!active) return;
        // Check if preferences exist (either analytics or necessary was set)
        setHasConsent(Boolean(json?.preferences));
      } catch (err) {
        console.error("Failed to check consent from API:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [address, getAccessToken, authenticated]);

  return { loading, hasConsent };
}
