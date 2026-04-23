"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword, getApiErrorMessage } from "@/services/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await resetPassword({ token, password });
      setDone(true);
      setTimeout(() => router.replace("/login"), 3000);
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
          <p className="kicker">Password Reset</p>
          <h1>Choose a new password</h1>
          <p>Your new password must be at least 8 characters long.</p>
        </header>

        {done ? (
          <div className="auth-success">
            <p>Password updated. Redirecting you to sign in...</p>
            <a href="/login" className="btn btn-primary">
              Go to Sign In
            </a>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                disabled={busy || !token}
                autoFocus
              />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                className="input"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                minLength={8}
                disabled={busy || !token}
              />
            </label>

            {error ? <p className="status-line error">{error}</p> : null}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !token || !password || !confirm}
            >
              {busy ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
