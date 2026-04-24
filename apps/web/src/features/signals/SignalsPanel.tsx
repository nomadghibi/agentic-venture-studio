"use client";

import { useEffect, useState } from "react";
import type { Signal } from "@avs/types";
import { fetchSignals, getApiErrorMessage } from "@/services/api";

export function SignalsPanel() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchSignals();
        if (!cancelled) setSignals(data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <article className="panel">
      <h2>Signals</h2>
      <p>Market signals linked to opportunities in this workspace.</p>
      {loading ? <p>Loading signals…</p> : null}
      {error ? <p className="status-line error">{error}</p> : null}
      {!loading && !error && signals.length === 0 ? (
        <p>No signals yet. Ingest a signal via the API to get started.</p>
      ) : null}
      {signals.length > 0 ? (
        <div className="timeline-list">
          {signals.map((signal) => (
            <div className="timeline-item" key={signal.id}>
              <div className="tl-head">
                <span className="tl-kind tl-kind-stage">{signal.sourceType}</span>
                {signal.sourceTitle ? (
                  <strong className="tl-title">{signal.sourceTitle}</strong>
                ) : null}
              </div>
              <p className="signal-excerpt">{signal.contentExcerpt}</p>
              {signal.sourceUrl ? (
                <small>
                  <a
                    href={signal.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="signal-link"
                  >
                    {signal.sourceUrl}
                  </a>
                </small>
              ) : null}
              <small>{new Date(signal.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
