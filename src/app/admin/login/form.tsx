"use client";

import { useActionState } from "react";
import { SignIn } from "@phosphor-icons/react";
import { login, type LoginState } from "@/app/actions";
import "@/components/rambu/tokens.css";
import "@/components/dashboard/dashboard.css";

// Login errors stay inline under the field (no toasts): one message, replaced on each try.
async function attempt(prev: LoginState, form: FormData): Promise<LoginState> {
  try {
    return await login(prev, form);
  } catch (e) {
    // fetch() rejects with a TypeError when the network is down; anything else (e.g. the redirect) is the framework's.
    if (e instanceof TypeError) return { error: "Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi." };
    throw e;
  }
}

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(attempt, {});

  return (
    <div className="login">
      <div className="hazard" aria-hidden />
      <form className="panel login-panel" action={action}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo, already sized */}
        <img className="login-logo" src="/logo-ppa.png" alt="Logo PPA" width={72} height={72} />
        <h1 className="plate-h" data-warna="yellow">Masuk ke panel TEAM SUPPORT</h1>
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
