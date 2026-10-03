import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth, firebaseEnabled } from "../lib/firebase";
import { initializeStore } from "../lib/store";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setUser(null);
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) await initializeStore();
      setReady(true);
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      console.error(err);
      setError("Unable to sign in. Check the email and password and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseEnabled) {
    return <div className="auth-screen"><div className="auth-card"><h1>Firebase configuration required</h1><p>Add the VITE_FIREBASE_* environment values before using the production CRM.</p></div></div>;
  }

  if (!ready || user === undefined) {
    return <div className="auth-screen"><div className="auth-card"><h1>FSANDHS CRM</h1><p>Connecting securely…</p></div></div>;
  }

  if (!user) {
    return <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo">F</div>
        <h1>FSANDHS CRM</h1>
        <p>Sign in with your authorized Firebase account.</p>
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {error && <div className="auth-error">{error}</div>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>;
  }

  return children;
}
