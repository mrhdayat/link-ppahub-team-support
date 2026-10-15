"use client";

import { useActionState } from "react";
import { SignIn } from "@phosphor-icons/react";
import { login, type LoginState } from "@/app/actions";
import "@/components/rambu/tokens.css";
import "@/components/editor/editor.css";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <div className="login">
      <div className="hazard" aria-hidden />
      <form className="panel login-panel" action={action}>
        <h1 className="plate-h" data-warna="yellow">Masuk ke editor</h1>
        <div className="field" data-invalid={state.error ? "" : undefined}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "password-err" : undefined}
          />
          {state.error && <p className="field-error" id="password-err" role="alert">{state.error}</p>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          <SignIn size={18} weight="bold" aria-hidden />
          {pending ? "Memeriksa…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
