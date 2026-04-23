"use client";

import { useState } from "react";
import { forgotPassword } from "@/services/api";
import { getApiErrorMessage } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <header className="auth-head">
          <p className="kicker">Password Recovery</p>
          <h1>Forgot your password?</h1>
          <p>
            Enter your account email and we&apos;ll send you a link to reset your password.
          </p>
        </header>

        {sent ? (
          <div className="auth-success">
            <p>
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
              Check your inbox (and spam folder).
            </p>
            <a href="/login" className="btn btn-ghost">
              Back to Sign In
            </a>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={busy}
                autoFocus
              />
            </label>

            {error ? <p className="status-line error">{error}</p> : null}

            <button type="submit" className="btn btn-primary" disabled={busy || !email}>
              {busy ? "Sending..." : "Send Reset Link"}
            </button>

            <a href="/login" className="auth-forgot-link">
              Back to Sign In
            </a>
          </form>
        )}
      </section>
    </main>
  );
}
