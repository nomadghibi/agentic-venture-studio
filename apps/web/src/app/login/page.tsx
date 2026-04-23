"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchSession,
  getApiErrorMessage,
  getApiStatusCode,
  login,
  register
} from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/workspace", [searchParams]);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("founder@agentic.local");
  const [loginPassword, setLoginPassword] = useState("FounderPass!2026");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerWorkspaceName, setRegisterWorkspaceName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const session = await fetchSession();
      if (!cancelled && session) {
        router.replace(nextPath);
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await login({
        email: loginEmail,
        password: loginPassword
      });
      router.replace(nextPath);
    } catch (loginError) {
      const statusCode = getApiStatusCode(loginError);
      if (statusCode === 401) {
        setError("Email or password is incorrect.");
      } else {
        setError(getApiErrorMessage(loginError));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await register({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        ...(registerWorkspaceName.trim()
          ? { workspaceName: registerWorkspaceName.trim() }
          : {})
      });

      router.replace(nextPath);
    } catch (registerError) {
      const statusCode = getApiStatusCode(registerError);
      if (statusCode === 409) {
        setError("That email is already in use. Try signing in instead.");
      } else {
        setError(getApiErrorMessage(registerError));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <header className="auth-head">
          <p className="kicker">AI Venture Validation Workspace</p>
          <h1>Sign in to your founder workspace</h1>
          <p>
            Validate ideas, score feasibility, and generate build-ready PRDs and MVP plans
            from one decision engine.
          </p>
        </header>

        <div className="auth-tabs" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "is-active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
            disabled={busy}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "is-active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
            disabled={busy}
          >
            Create Account
          </button>
        </div>

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                className="input"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
                disabled={busy}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                className="input"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                required
                minLength={8}
                disabled={busy}
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Signing In..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                className="input"
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                required
                minLength={2}
                disabled={busy}
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                className="input"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                required
                disabled={busy}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                className="input"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                required
                minLength={8}
                disabled={busy}
              />
            </label>
            <label className="field">
              <span>Workspace name (optional)</span>
              <input
                type="text"
                className="input"
                value={registerWorkspaceName}
                onChange={(event) => setRegisterWorkspaceName(event.target.value)}
                disabled={busy}
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}

        {error ? <p className="status-line error">{error}</p> : null}

        <footer className="auth-footnote">
          <small>
            Demo credentials: <strong>founder@agentic.local</strong> / <strong>FounderPass!2026</strong>
          </small>
        </footer>
      </section>
    </main>
  );
}
