"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { buttonClasses } from "./button";

/** Copies an absolute URL for an app path (e.g. a self-invoice link to send by WhatsApp). */
export function CopyLinkButton({ path, label = "Copiar enlace" }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia este enlace:", `${window.location.origin}${path}`);
    }
  };
  return (
    <button type="button" onClick={copy} className={buttonClasses({ variant: "secondary", size: "sm" })}>
      {copied ? <Check className="size-4 text-primary" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      {copied ? "¡Copiado!" : label}
    </button>
  );
}
