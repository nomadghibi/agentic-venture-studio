"use client";

import { useState } from "react";
import type { Opportunity } from "@avs/types";
import { ingestSignal, getApiErrorMessage } from "@/services/api";

const SOURCE_TYPES = [
  "reddit_thread",
  "twitter_post",
  "linkedin_post",
  "customer_interview",
  "support_ticket",
  "news_article",
  "forum_post",
  "other"
];

type IngestSignalFormProps = {
  opportunities: Opportunity[];
  onSignalIngested?: () => void;
};

export function IngestSignalForm({ opportunities, onSignalIngested }: IngestSignalFormProps) {
  const [sourceType, setSourceType] = useState("reddit_thread");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [contentExcerpt, setContentExcerpt] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback("");
    setError("");
    try {
      await ingestSignal({
        sourceType,
        contentExcerpt,
        ...(sourceTitle.trim() ? { sourceTitle: sourceTitle.trim() } : {}),
        ...(sourceUrl.trim() ? { sourceUrl: sourceUrl.trim() } : {}),
        ...(opportunityId ? { opportunityId } : {})
      });
      setFeedback("Signal ingested. Discovery agent will analyze it shortly.");
      setContentExcerpt("");
      setSourceTitle("");
      setSourceUrl("");
      setOpportunityId("");
      onSignalIngested?.();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="panel">
      <h2>Ingest Market Signal</h2>
      <p>Paste a signal from any source. The discovery agent will analyze it automatically.</p>

      {feedback ? <p className="status-line success">{feedback}</p> : null}
      {error ? <p className="status-line error">{error}</p> : null}

      <form className="stack" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Source Type</span>
            <select
              className="select"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              disabled={busy}
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Source Title (optional)</span>
            <input
              className="input"
              value={sourceTitle}
              onChange={(e) => setSourceTitle(e.target.value)}
              placeholder="e.g. Post title or article headline"
              disabled={busy}
            />
          </label>

          <label className="field field-span">
            <span>Source URL (optional)</span>
            <input
              className="input"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              disabled={busy}
            />
          </label>

          <label className="field field-span">
            <span>Content Excerpt</span>
            <textarea
              className="textarea"
              rows={5}
              value={contentExcerpt}
              onChange={(e) => setContentExcerpt(e.target.value)}
              placeholder="Paste the relevant text, quote, or description here…"
              required
              disabled={busy}
              maxLength={10_000}
            />
          </label>

          {opportunities.length > 0 ? (
            <label className="field">
              <span>Link to Opportunity (optional)</span>
              <select
                className="select"
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                disabled={busy}
              >
                <option value="">— No link —</option>
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="button-row">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={busy || !contentExcerpt.trim()}
          >
            {busy ? "Ingesting…" : "Ingest Signal"}
          </button>
        </div>
      </form>
    </article>
  );
}
