"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions";
import { PANEL } from "@/components/editor/panel";
import "@/components/editor/editor.css";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <div className="login-bench ui" style={PANEL}>
      <form className="panel login" action={action}>
        <h1 className="tape">Masuk ke editor</h1>
        <div className="field" data-invalid={state.error ? "" : undefined}>
          <div className="field-head">
            <label htmlFor="password">Password</label>
          </div>
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
        <button type="submit" className="btn save" data-dirty={pending || undefined} disabled={pending}>
          <span className="lamp" aria-hidden />
          {pending ? "Memeriksa…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
