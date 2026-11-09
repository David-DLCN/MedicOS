"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  File,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Info,
  Receipt,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DocumentCategory, PatientDocument } from "@/lib/domain/types";
import { formatBytes, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteStoredDocument, listStoredDocuments, saveStoredDocument, type StoredDocument } from "./document-store";
import { DOCUMENT_CATEGORY, UPLOAD_CATEGORIES, guessCategory } from "./labels";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Most recent documents shown before "Mostrar todos" (keeps the profile short). */
const COLLAPSED_COUNT = 8;

function iconFor(doc: PatientDocument) {
  if (doc.source === "receipt") return Receipt;
  const type = doc.mimeType;
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("video/")) return FileVideo;
  if (type.startsWith("audio/")) return FileAudio;
  if (/sheet|excel|csv/.test(type)) return FileSpreadsheet;
  if (type === "application/pdf" || type.startsWith("text/") || /word|document/.test(type)) return FileText;
  return File;
}

type StoreState = "loading" | "ready" | "unavailable";

/**
 * Patient document folder: sample documents and receipts come from the server;
 * files the doctor uploads are kept in this browser (demo, no backend yet).
 * Any file type is accepted.
 */
export function PatientDocuments({
  patientId,
  documents,
}: {
  patientId: string;
  documents: PatientDocument[];
}) {
  const [uploads, setUploads] = useState<StoredDocument[]>([]);
  const [storeState, setStoreState] = useState<StoreState>("loading");
  const [filter, setFilter] = useState<DocumentCategory | "all">("all");
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | "auto">("auto");
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    listStoredDocuments(patientId)
      .then((stored) => {
        if (!active) return;
        setUploads(stored);
        setStoreState("ready");
      })
      .catch(() => active && setStoreState("unavailable"));
    return () => {
      active = false;
    };
  }, [patientId]);

  const all = useMemo(
    () => [...uploads, ...documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [uploads, documents],
  );
  const counts = useMemo(() => {
    const result = new Map<DocumentCategory, number>();
    for (const doc of all) result.set(doc.category, (result.get(doc.category) ?? 0) + 1);
    return result;
  }, [all]);
  const filtered = filter === "all" ? all : all.filter((doc) => doc.category === filter);
  const visible = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);
  const hiddenCount = filtered.length - visible.length;

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      const tooBig = list.filter((file) => file.size > MAX_FILE_BYTES);
      const accepted = list.filter((file) => file.size <= MAX_FILE_BYTES);
      const saved: StoredDocument[] = [];
      for (const file of accepted) {
        const doc: StoredDocument = {
          id: crypto.randomUUID(),
          patientId,
          name: file.name,
          category: uploadCategory === "auto" ? guessCategory(file) : uploadCategory,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          createdAt: new Date().toISOString(),
          source: "upload",
          blob: file,
        };
        try {
          await saveStoredDocument(doc);
          saved.push(doc);
        } catch {
          setStoreState("unavailable");
        }
      }
      setUploads((current) => [...saved, ...current]);
      setMessage(
        [
          saved.length > 0 ? `${formatNumber(saved.length)} archivo(s) añadido(s).` : "",
          tooBig.length > 0 ? `${tooBig.map((f) => f.name).join(", ")}: supera los 25 MB.` : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
    },
    [patientId, uploadCategory],
  );

  const removeUpload = async (doc: StoredDocument) => {
    if (!window.confirm(`¿Eliminar «${doc.name}» de la carpeta?`)) return;
    await deleteStoredDocument(doc.id);
    setUploads((current) => current.filter((item) => item.id !== doc.id));
  };

  const openUpload = (doc: StoredDocument) => {
    const url = URL.createObjectURL(doc.blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const downloadUpload = (doc: StoredDocument) => {
    const url = URL.createObjectURL(doc.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const canUpload = storeState === "ready";

  return (
    <Card>
      <CardHeader
        title="Documentos"
        description={`${formatNumber(all.length)} en la carpeta del paciente`}
        action={
          <button
            type="button"
            disabled={!canUpload}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-8 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <Upload className="size-4" aria-hidden /> Subir archivos
          </button>
        }
      />
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          aria-label="Subir archivos"
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files);
            event.target.value = "";
          }}
        />

        {/* Drop zone: accepts any file type */}
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (canUpload) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (canUpload) void addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col gap-3 rounded-lg border border-dashed px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between",
            dragging ? "border-primary bg-primary-soft" : "border-border-strong",
          )}
        >
          <p className="text-muted">
            <span className="font-medium text-foreground">Arrastra aquí cualquier archivo</span>: interpretaciones,
            recetas, imágenes, informes… Hasta 25 MB cada uno.
          </p>
          <label className="flex shrink-0 items-center gap-2 text-xs text-muted">
            Guardar como
            <select
              value={uploadCategory}
              onChange={(event) => setUploadCategory(event.target.value as DocumentCategory | "auto")}
              className="h-8 rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
            >
              <option value="auto">Detectar automáticamente</option>
              {UPLOAD_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {DOCUMENT_CATEGORY[category]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {message ? (
          <p role="status" className="text-sm text-muted">
            {message}
          </p>
        ) : null}

        {all.length > 0 ? (
          <nav aria-label="Filtrar documentos" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {(["all", ...Object.keys(DOCUMENT_CATEGORY)] as (DocumentCategory | "all")[])
              .filter((category) => category === "all" || counts.has(category))
              .map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setFilter(category);
                    setExpanded(false);
                  }}
                  aria-pressed={filter === category}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                    filter === category
                      ? "bg-primary-soft text-primary"
                      : "text-muted hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  {category === "all" ? "Todos" : DOCUMENT_CATEGORY[category]}
                  <span className="tabular text-xs opacity-70">
                    {formatNumber(category === "all" ? all.length : (counts.get(category) ?? 0))}
                  </span>
                </button>
              ))}
          </nav>
        ) : null}

        {visible.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">Aún no hay documentos en esta carpeta.</p>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((doc) => {
              const Icon = iconFor(doc);
              const upload = doc.source === "upload" ? (doc as StoredDocument) : null;
              return (
                <li key={doc.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{doc.name}</span>
                      {doc.source === "sample" ? (
                        <Badge tone="neutral" className="shrink-0">
                          Ejemplo
                        </Badge>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {DOCUMENT_CATEGORY[doc.category]} · {formatDate(doc.createdAt)}
                      {doc.size > 0 ? ` · ${formatBytes(doc.size)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {doc.source === "receipt" && doc.transactionId ? (
                      <Link
                        href={`/receipts/${doc.transactionId}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-surface-muted"
                      >
                        <ExternalLink className="size-3.5" aria-hidden /> Ver
                      </Link>
                    ) : null}
                    {upload ? (
                      <>
                        <IconButton label={`Abrir ${doc.name}`} onClick={() => openUpload(upload)}>
                          <ExternalLink className="size-4" aria-hidden />
                        </IconButton>
                        <IconButton label={`Descargar ${doc.name}`} onClick={() => downloadUpload(upload)}>
                          <Download className="size-4" aria-hidden />
                        </IconButton>
                        <IconButton label={`Eliminar ${doc.name}`} onClick={() => void removeUpload(upload)} danger>
                          <Trash2 className="size-4" aria-hidden />
                        </IconButton>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {hiddenCount > 0 || expanded ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="w-full rounded-lg border border-border py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            {expanded ? "Mostrar menos" : `Mostrar todos (${formatNumber(hiddenCount)} más)`}
          </button>
        ) : null}

        <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-xs text-info">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          {storeState === "unavailable"
            ? "Este navegador no permite guardar archivos localmente, así que la subida está desactivada en la demo."
            : "Demo: los archivos que subas se guardan solo en este navegador y nadie más puede verlos. No subas documentos reales de pacientes. Los documentos «Ejemplo» no tienen archivo."}
        </p>
      </CardContent>
    </Card>
  );
}

function IconButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted",
        danger ? "hover:text-danger" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
