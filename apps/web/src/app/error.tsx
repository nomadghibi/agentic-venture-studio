"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <main className="page-shell">
      <article className="panel" style={{ maxWidth: 480, margin: "80px auto" }}>
        <h1>Something went wrong</h1>
        <p style={{ marginTop: 8 }}>
          {error.message || "An unexpected error occurred. The team has been notified."}
        </p>
        {error.digest ? (
          <p style={{ marginTop: 8 }}>
            <small className="muted">Reference: {error.digest}</small>
          </p>
        ) : null}
        <div className="button-row" style={{ marginTop: 24 }}>
          <button className="btn btn-primary" type="button" onClick={reset}>
            Try again
          </button>
          <Link href="/workspace" className="btn btn-ghost">
            Back to Workspace
          </Link>
        </div>
      </article>
    </main>
  );
}
