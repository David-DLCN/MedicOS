"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signIn, signUp, type AuthState } from "./actions";

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-2 focus:outline-primary/20";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "signin" ? signInState : signUpState;
  const pending = signingIn || signingUp;

  return (
    <div>
      <div role="tablist" aria-label="Acceso" className="mb-6 grid grid-cols-2 rounded-lg bg-surface-muted p-1">
        {(
          [
            ["signin", "Iniciar sesión"],
            ["signup", "Crear cuenta"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "rounded-md py-1.5 text-sm font-medium transition-colors",
              mode === value ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form action={mode === "signin" ? signInAction : signUpAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm font-medium">
          Correo electrónico
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className={inputClass}
          />
          {mode === "signup" ? (
            <span className="mt-1 block text-xs font-normal text-subtle">Mínimo 8 caracteres.</span>
          ) : null}
        </label>

        {state.error ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p role="status" className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="h-10 w-full">
          {pending ? "Un momento…" : mode === "signin" ? "Entrar" : "Crear mi cuenta"}
        </Button>
      </form>
    </div>
  );
}
