"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  FileText,
  Library,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { api, ApiError, type DocumentItem } from "@/lib/api";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeBasePage() {
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selected, setSelected] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, me] = await Promise.all([api.documents.list(), api.auth.me()]);
      setDocuments(items);
      setIsAdmin(me.role === "admin");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Your session has expired. Please sign in again."
          : err instanceof Error
            ? err.message
            : "Failed to load documents"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setError(null);
    setNotice(null);
    const failures: string[] = [];
    let uploaded = 0;

    for (const file of fileArray) {
      try {
        await api.documents.upload(file);
        uploaded += 1;
      } catch (err) {
        failures.push(
          `${file.name}: ${err instanceof Error ? err.message : "upload failed"}`
        );
      }
    }

    await load();
    setUploading(false);

    if (uploaded > 0) {
      setNotice(`${uploaded} document${uploaded === 1 ? "" : "s"} uploaded and indexed.`);
    }
    if (failures.length > 0) {
      setError(failures.join(" · "));
    }
  }

  async function handleDelete(doc: DocumentItem) {
    if (!window.confirm(`Delete "${doc.original_filename}" and its vectors?`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await api.documents.remove(doc.id);
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
      if (selected?.id === doc.id) setSelected(null);
      setNotice(`Deleted "${doc.original_filename}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  }

  const filtered = documents.filter((doc) =>
    doc.original_filename.toLowerCase().includes(search.toLowerCase())
  );

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);
  const totalBytes = documents.reduce((sum, doc) => sum + doc.file_size, 0);
  const lastUpload = documents.reduce<string | null>(
    (latest, doc) => (!latest || doc.created_at > latest ? doc.created_at : latest),
    null
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt,.md"
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            void addFiles(event.target.files);
            event.target.value = "";
          }
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
            <Library className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
            Knowledge Base
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Documents indexed for retrieval-augmented answers
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading || uploading}
          className="btn-outline flex items-center gap-2 text-sm shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="widget-card flex items-center gap-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="widget-card text-sm text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30">
          {notice}
        </div>
      )}

      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 md:p-10 text-center transition-all",
          dragOver
            ? "border-secondary-500 bg-secondary-500/5"
            : "border-gray-300 dark:border-gray-600 hover:border-secondary-400 dark:hover:border-secondary-500",
          !isAdmin && "opacity-60"
        )}
        onDragOver={(event) => {
          if (!isAdmin) return;
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (isAdmin && event.dataTransfer.files.length > 0) {
            void addFiles(event.dataTransfer.files);
          }
        }}
      >
        <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-500 mx-auto mb-3 md:mb-4" />
        <h3 className="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {uploading ? "Uploading and indexing..." : "Upload Document"}
        </h3>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-4 max-w-md mx-auto">
          {isAdmin
            ? "Drag & drop PDF, DOCX, TXT or Markdown files here, or click to browse."
            : "Administrator access is required to upload or delete documents."}
        </p>
        <button
          className="btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !isAdmin}
        >
          {uploading ? "Uploading..." : "Browse Files"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="widget-card">
          <p className="text-xs md:text-sm text-gray-500">Total Documents</p>
          <p className="text-xl md:text-2xl font-bold text-primary-900 dark:text-white">
            {documents.length}
          </p>
        </div>
        <div className="widget-card">
          <p className="text-xs md:text-sm text-gray-500">Total Chunks</p>
          <p className="text-xl md:text-2xl font-bold text-secondary-500">
            {totalChunks.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="widget-card">
          <p className="text-xs md:text-sm text-gray-500">Last Upload</p>
          <p className="text-base md:text-lg font-bold text-accent-500">
            {lastUpload ? formatRelativeTime(lastUpload) : "—"}
          </p>
        </div>
        <div className="widget-card">
          <p className="text-xs md:text-sm text-gray-500">Storage Used</p>
          <p className="text-xl md:text-2xl font-bold text-primary-900 dark:text-white">
            {formatFileSize(totalBytes)}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search documents..."
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-12">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading documents...
        </div>
      ) : filtered.length === 0 ? (
        <div className="widget-card text-center py-10">
          <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {documents.length === 0
              ? "No documents indexed yet."
              : "No documents match your search."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {filtered.map((doc) => (
              <div key={doc.id} className="widget-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-accent-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      className="font-medium text-primary-900 dark:text-white truncate text-left"
                      onClick={() => setSelected(doc)}
                    >
                      {doc.original_filename}
                    </button>
                    <p className="text-xs text-gray-400">
                      {doc.file_type.toUpperCase()} &middot; {formatFileSize(doc.file_size)} &middot;{" "}
                      {doc.chunk_count} chunks
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {formatDate(doc.created_at)}
                  </span>
                  {isAdmin && (
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors"
                      onClick={() => void handleDelete(doc)}
                      aria-label={`Delete ${doc.original_filename}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block glass rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700/50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Chunks
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-primary-800/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-accent-500" />
                        </div>
                        <button
                          className="font-medium text-primary-900 dark:text-white text-left"
                          onClick={() => setSelected(doc)}
                        >
                          {doc.original_filename}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="badge badge-info">{doc.file_type.toUpperCase()}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">{doc.chunk_count}</td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isAdmin ? (
                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors"
                          onClick={() => void handleDelete(doc)}
                          aria-label={`Delete ${doc.original_filename}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-primary-900 rounded-2xl shadow-xl w-full max-w-lg p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-primary-900 dark:text-white truncate">
                  {selected.original_filename}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Uploaded {formatDate(selected.created_at, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <button
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ["Stored filename", selected.filename],
                ["Type", selected.file_type.toUpperCase()],
                ["Size", formatFileSize(selected.file_size)],
                ["Chunks", String(selected.chunk_count)],
                ["Description", selected.description || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 py-2 px-3 rounded-lg bg-gray-50 dark:bg-primary-800/50"
                >
                  <dt className="text-gray-500 dark:text-gray-400 shrink-0">{label}</dt>
                  <dd className="text-gray-700 dark:text-gray-200 text-right break-all">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-gray-400 mt-4">
              Document text is embedded in the vector store; the API does not expose
              a raw-text preview endpoint.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
