"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions";
import { PANEL } from "@/components/editor/panel";
import "@/components/faceplate.css";
import "@/components/editor/editor.css";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <div className="desk login-desk" style={PANEL}>
      <form className="unit login" action={action}>
        <span className="screw" data-pos="tl" aria-hidden />
        <span className="screw" data-pos="tr" aria-hidden />
        <h1>Masuk ke editor</h1>
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
        <button type="submit" className="btn primary" data-busy={pending || undefined} disabled={pending}>
          <span className="led" aria-hidden />
          {pending ? "Memeriksa…" : "Masuk"}
        </button>
        <span className="screw" data-pos="bl" aria-hidden />
        <span className="screw" data-pos="br" aria-hidden />
      </form>
    </div>
  );
}
