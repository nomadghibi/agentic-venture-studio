"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthSession } from "@avs/types";
import { fetchSession, getApiStatusCode } from "@/services/api";

type UseAuthResult = {
  session: AuthSession | null;
  loading: boolean;
};

export function useAuth(redirectTo: string): UseAuthResult {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const active = await fetchSession();
        if (cancelled) return;

        if (!active) {
          router.replace(`/login?next=${encodeURIComponent(redirectTo)}`);
          return;
        }

        setSession(active);
      } catch (err) {
        if (cancelled) return;
        const code = getApiStatusCode(err);
        if (code === 401) {
          router.replace(`/login?next=${encodeURIComponent(redirectTo)}`);
          return;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void check();
    return () => { cancelled = true; };
  }, [redirectTo, router]);

  return { session, loading };
}
