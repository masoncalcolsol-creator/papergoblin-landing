"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

type RecordKey = "messages" | "calendar";

type PageRecord = {
  id: string;
  record: RecordKey;
  page: number;
  totalPages: number;
  title: string;
  dates: string[];
  text: string;
};

type RecordMeta = {
  key: RecordKey;
  label: string;
  auth: string;
  generated: string;
  sha256: string;
  pages: number;
  filename: string;
};

type CorpusMeta = {
  version: string;
  created: string;
  records: RecordMeta[];
  privacy: {
    pdfsHosted: boolean;
    indexEncrypted: boolean;
    pinSecurity: string;
  };
};

type Manifest = {
  version: number;
  kdf: string;
  iterations: number;
  salt: string;
  compression: string;
  cipher: string;
  corpora: string[];
  pageCount: number;
};

type SearchResult = PageRecord & { score: number; snippet: string };

type PdfMap = Partial<Record<RecordKey, any>>;
type FileMap = Partial<Record<RecordKey, File>>;

const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const b64ToBytes = (value: string) => {
  const raw = atob(value);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const termsFromQuery = (query: string) =>
  query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1);

const makeSnippet = (text: string, terms: string[]) => {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return "No extractable text was found on this page.";
  if (!terms.length) return flat.slice(0, 360);
  const lower = flat.toLowerCase();
  const positions = terms.map((term) => lower.indexOf(term)).filter((value) => value >= 0);
  const first = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, first - 130);
  const end = Math.min(flat.length, first + 300);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
};

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "gi");
  return (
    <>
      {text.split(pattern).map((part, index) =>
        terms.some((term) => part.toLowerCase() === term.toLowerCase()) ? (
          <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-0.5 text-slate-950">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">{label}</div>
      <div className="mt-2 break-words text-sm font-bold text-white">{value}</div>
    </div>
  );
}

export default function TalkingParentsEvidencePortal() {
  const [pin, setPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [meta, setMeta] = useState<CorpusMeta | null>(null);
  const [query, setQuery] = useState("");
  const [recordFilter, setRecordFilter] = useState<"all" | RecordKey>("all");
  const [loadedLabels, setLoadedLabels] = useState<Partial<Record<RecordKey, string>>>({});
  const [viewer, setViewer] = useState<PageRecord | null>(null);
  const [rendering, setRendering] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfJsReady, setPdfJsReady] = useState(false);
  const [zoom, setZoom] = useState(1.1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const pdfDocsRef = useRef<PdfMap>({});
  const pdfFilesRef = useRef<FileMap>({});
  const objectUrlsRef = useRef<Partial<Record<RecordKey, string>>>({});

  const unlocked = pages.length > 0 && meta !== null;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = PDFJS_URL;
    script.async = true;
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        setPdfJsReady(true);
      }
    };
    script.onerror = () => setPdfError("PDF renderer could not be loaded. Search remains available.");
    document.head.appendChild(script);
    return () => {
      script.remove();
      Object.values(objectUrlsRef.current).forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, []);

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    setUnlockError("");
    setUnlocking(true);
    try {
      const manifestResponse = await fetch("/tp-evidence/manifest.json", { cache: "no-store" });
      if (!manifestResponse.ok) throw new Error("Manifest unavailable");
      const manifest = (await manifestResponse.json()) as Manifest;
      const pinBytes = new TextEncoder().encode(pin);
      const baseKey = await crypto.subtle.importKey("raw", pinBytes, "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: b64ToBytes(manifest.salt),
          iterations: manifest.iterations,
          hash: "SHA-256",
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"],
      );

      const decryptedPages: PageRecord[] = [];
      let decryptedMeta: CorpusMeta | null = null;
      for (const corpusFile of manifest.corpora) {
        const corpusResponse = await fetch(`/tp-evidence/${corpusFile}`, { cache: "force-cache" });
        if (!corpusResponse.ok) throw new Error(`Encrypted corpus unavailable: ${corpusFile}`);
        const corpus = (await corpusResponse.json()) as { chunks: { iv: string; aad: string; data: string }[] };
        for (const encrypted of corpus.chunks) {
        const plain = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: b64ToBytes(encrypted.iv),
            additionalData: new TextEncoder().encode(encrypted.aad),
          },
          key,
          b64ToBytes(encrypted.data),
        );
        const decompressed = new Response(
          new Blob([plain]).stream().pipeThrough(new DecompressionStream("gzip")),
        );
        const payload = (await decompressed.json()) as { pages: PageRecord[]; meta?: CorpusMeta };
        decryptedPages.push(...payload.pages);
        if (payload.meta) decryptedMeta = payload.meta;
        }
      }
      if (!decryptedMeta || decryptedPages.length !== manifest.pageCount) throw new Error("Corpus integrity check failed");
      setPages(decryptedPages);
      setMeta(decryptedMeta);
      setPin("");
      sessionStorage.setItem("tp-evidence-unlocked", "1");
    } catch (error) {
      console.error(error);
      setUnlockError("PIN rejected or encrypted corpus unavailable. Verify PIN and retry.");
    } finally {
      setUnlocking(false);
    }
  };

  const lock = () => {
    setPages([]);
    setMeta(null);
    setQuery("");
    setViewer(null);
    pdfDocsRef.current = {};
    pdfFilesRef.current = {};
    Object.values(objectUrlsRef.current).forEach((url) => url && URL.revokeObjectURL(url));
    objectUrlsRef.current = {};
    setLoadedLabels({});
    sessionStorage.removeItem("tp-evidence-unlocked");
  };

  const results = useMemo<SearchResult[]>(() => {
    if (!unlocked) return [];
    const terms = termsFromQuery(query);
    const filtered = pages.filter((page) => recordFilter === "all" || page.record === recordFilter);
    if (!terms.length) {
      return filtered.slice(0, 50).map((page) => ({ ...page, score: 0, snippet: makeSnippet(page.text, []) }));
    }
    return filtered
      .map((page) => {
        const haystack = `${page.title}\n${page.text}`.toLowerCase();
        let score = 0;
        for (const term of terms) {
          const titleHits = page.title.toLowerCase().split(term).length - 1;
          const bodyHits = haystack.split(term).length - 1;
          if (!bodyHits) return null;
          score += titleHits * 12 + Math.min(bodyHits, 20) * 2;
        }
        if (haystack.includes(terms.join(" "))) score += 20;
        return { ...page, score, snippet: makeSnippet(page.text, terms) };
      })
      .filter((page): page is SearchResult => Boolean(page))
      .sort((a, b) => b.score - a.score || a.record.localeCompare(b.record) || a.page - b.page)
      .slice(0, 200);
  }, [pages, query, recordFilter, unlocked]);

  const loadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    setPdfError("");
    if (!pdfJsReady) {
      setPdfError("PDF renderer is still loading. Wait a moment and select the files again.");
      return;
    }
    const files = Array.from(event.target.files ?? []);
    const pdfjsLib = (window as any).pdfjsLib;
    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
        const key: RecordKey | null = doc.numPages === 1241 ? "messages" : doc.numPages === 99 ? "calendar" : null;
        if (!key) {
          setPdfError(`${file.name} has ${doc.numPages} pages and does not match either authenticated export.`);
          continue;
        }
        if (objectUrlsRef.current[key]) URL.revokeObjectURL(objectUrlsRef.current[key] as string);
        pdfDocsRef.current[key] = doc;
        pdfFilesRef.current[key] = file;
        objectUrlsRef.current[key] = URL.createObjectURL(file);
        setLoadedLabels((current) => ({ ...current, [key]: `${file.name} · ${doc.numPages} pages` }));
      } catch (error) {
        console.error(error);
        setPdfError(`Could not load ${file.name}. Confirm it is the original PDF export.`);
      }
    }
    event.target.value = "";
  };

  const renderViewer = async (page: PageRecord, selectedZoom = zoom) => {
    setViewer(page);
    setRendering(true);
    setPdfError("");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const doc = pdfDocsRef.current[page.record];
    if (!doc) {
      setRendering(false);
      return;
    }
    try {
      const sourcePage = await doc.getPage(page.page);
      const wrapWidth = Math.max(280, (canvasWrapRef.current?.clientWidth ?? window.innerWidth - 32) - 24);
      const baseViewport = sourcePage.getViewport({ scale: 1 });
      const fitScale = Math.min(2.3, wrapWidth / baseViewport.width);
      const viewport = sourcePage.getViewport({ scale: fitScale * selectedZoom });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      await sourcePage.render({
        canvasContext: context,
        viewport,
        transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
      }).promise;
    } catch (error) {
      console.error(error);
      setPdfError("The selected source page could not be rendered.");
    } finally {
      setRendering(false);
    }
  };

  useEffect(() => {
    if (viewer && pdfDocsRef.current[viewer.record]) void renderViewer(viewer, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const openViewer = async (page: PageRecord) => {
    setZoom(1.1);
    await renderViewer(page, 1.1);
  };

  const openNativePdf = (page: PageRecord) => {
    const url = objectUrlsRef.current[page.record];
    if (!url) return;
    window.open(`${url}#page=${page.page}`, "_blank", "noopener,noreferrer");
  };

  const savePng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !viewer) return;
    const link = document.createElement("a");
    link.download = `${viewer.record}-page-${String(viewer.page).padStart(4, "0")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copyCitation = async (page: PageRecord) => {
    const record = meta?.records.find((item) => item.key === page.record);
    if (!record) return;
    const citation = `TalkingParents ${record.label}, Unique Authentication Code ${record.auth}, generated ${record.generated}, page ${page.page} of ${record.pages}. SHA-256 of original PDF: ${record.sha256}.`;
    await navigator.clipboard.writeText(citation);
  };

  const terms = termsFromQuery(query);

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-[#071219] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="rounded-[32px] border border-cyan-300/20 bg-[#0d202a] p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">NULLWORKS / LEGALFLOW</div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl">TalkingParents Evidence Portal</h1>
            <p className="mt-4 leading-7 text-slate-300">
              Searchable page-level index for the authenticated message and calendar exports. The index is encrypted at rest. The original PDFs are not hosted by this site.
            </p>
            <form onSubmit={unlock} className="mt-7">
              <label className="text-xs font-black uppercase tracking-[0.22em] text-slate-400" htmlFor="pin">
                Access PIN
              </label>
              <input
                id="pin"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                className="mt-3 w-full rounded-2xl border border-white/15 bg-black/30 px-5 py-4 text-center text-3xl font-black tracking-[0.45em] outline-none ring-cyan-300 focus:ring-2"
                placeholder="••••"
                aria-label="Access PIN"
              />
              <button
                type="submit"
                disabled={unlocking || pin.length < 4}
                className="mt-4 w-full rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {unlocking ? "Decrypting corpus…" : "Unlock evidence index"}
              </button>
            </form>
            {unlockError && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200">{unlockError}</div>}
            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs leading-6 text-amber-100/80">
              A four-digit PIN is a convenience gate, not strong access control. The encrypted search corpus can still be brute-forced by a determined attacker. Do not share the URL broadly.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071219] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-white/10 bg-[#0d202a] p-5 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">NULLWORKS / LEGALFLOW</div>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">TalkingParents Evidence Portal</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Search 1,340 authenticated source pages. Load either original PDF locally to render, cite, open, or export the exact source page.
              </p>
            </div>
            <button onClick={lock} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300 hover:bg-white/5">
              Lock
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Message pages" value="1,241" />
            <Stat label="Calendar pages" value="99" />
            <Stat label="Corpus state" value="AES-GCM encrypted at rest" />
            <Stat label="Source handling" value="Original PDFs stay on your device" />
          </div>
        </header>

        <section className="mt-5 grid gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-[26px] border border-white/10 bg-[#0d202a] p-5">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">1. Load originals</div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Select the two unmodified TalkingParents PDFs from this device. Files are read in your browser and are not uploaded.
              </p>
              <label className="mt-4 block cursor-pointer rounded-2xl bg-cyan-300 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-slate-950">
                Select PDF file(s)
                <input type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={loadFiles} />
              </label>
              <div className="mt-4 space-y-2 text-xs">
                <div className={`rounded-xl border p-3 ${loadedLabels.messages ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-black/20 text-slate-500"}`}>
                  <strong>Messages:</strong> {loadedLabels.messages ?? "not loaded"}
                </div>
                <div className={`rounded-xl border p-3 ${loadedLabels.calendar ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-black/20 text-slate-500"}`}>
                  <strong>Calendar:</strong> {loadedLabels.calendar ?? "not loaded"}
                </div>
              </div>
              {pdfError && <div className="mt-3 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-xs leading-5 text-red-200">{pdfError}</div>}
            </div>

            <div className="rounded-[26px] border border-white/10 bg-[#0d202a] p-5">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Source receipts</div>
              <div className="mt-4 space-y-4">
                {meta.records.map((record) => (
                  <div key={record.key} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-slate-400">
                    <div className="font-black text-white">{record.label}</div>
                    <div className="mt-2">Auth: <span className="font-mono text-cyan-200">{record.auth}</span></div>
                    <div>Pages: {record.pages}</div>
                    <div>Generated: {record.generated}</div>
                    <div className="mt-2 break-all font-mono text-[10px] text-slate-500">SHA-256: {record.sha256}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section>
            <div className="sticky top-3 z-10 rounded-[26px] border border-white/10 bg-[#0d202a]/95 p-4 shadow-xl shadow-black/20 backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder='Search exact words, e.g. "financial documents" or tutoring'
                  className="min-w-0 rounded-2xl border border-white/15 bg-black/30 px-5 py-4 text-base outline-none ring-cyan-300 placeholder:text-slate-600 focus:ring-2"
                  autoFocus
                />
                <select
                  value={recordFilter}
                  onChange={(event) => setRecordFilter(event.target.value as "all" | RecordKey)}
                  className="rounded-2xl border border-white/15 bg-[#102733] px-4 py-3 text-sm font-bold outline-none"
                >
                  <option value="all">All records</option>
                  <option value="messages">Messages only</option>
                  <option value="calendar">Calendar only</option>
                </select>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{query.trim() ? `${results.length} ranked page matches` : "Showing first 50 source pages"}</span>
                <span>Search is local after decryption; no query is sent to a server.</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {results.map((result) => {
                const sourceLoaded = Boolean(pdfDocsRef.current[result.record]);
                const recordMeta = meta.records.find((record) => record.key === result.record);
                return (
                  <article key={result.id} className="rounded-[24px] border border-white/10 bg-[#0d202a] p-5 shadow-lg shadow-black/10">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                          <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-cyan-200">{result.record}</span>
                          <span className="rounded-full bg-white/5 px-3 py-1 text-slate-400">Page {result.page} of {result.totalPages}</span>
                          {result.dates.slice(0, 3).map((date) => <span key={date} className="rounded-full bg-white/5 px-3 py-1 text-slate-500">{date}</span>)}
                        </div>
                        <h2 className="mt-3 text-xl font-black tracking-[-0.02em] text-white">
                          <Highlight text={result.title} terms={terms} />
                        </h2>
                      </div>
                      <div className="text-right text-[10px] text-slate-600">Auth {recordMeta?.auth}</div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      <Highlight text={result.snippet} terms={terms} />
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => void openViewer(result)}
                        className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${sourceLoaded ? "bg-cyan-300 text-slate-950" : "border border-white/15 text-slate-400"}`}
                      >
                        {sourceLoaded ? "View exact PDF page" : "Load PDF to view page"}
                      </button>
                      <button onClick={() => void copyCitation(result)} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-300 hover:bg-white/5">
                        Copy source citation
                      </button>
                    </div>
                  </article>
                );
              })}
              {!results.length && (
                <div className="rounded-[24px] border border-white/10 bg-[#0d202a] p-8 text-center text-slate-400">No page contains every search term. Try fewer or more specific words.</div>
              )}
            </div>
          </section>
        </section>
      </div>

      {viewer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-2 sm:p-5">
          <div className="mx-auto max-w-6xl rounded-[24px] border border-white/15 bg-[#0d202a] shadow-2xl">
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d202a]/95 p-4 backdrop-blur">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">{viewer.record} · source page {viewer.page} of {viewer.totalPages}</div>
                <div className="mt-1 max-w-2xl truncate text-sm font-bold text-white">{viewer.title}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setZoom((value) => Math.max(0.65, value - 0.15))} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black">−</button>
                <button onClick={() => setZoom(1.1)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black">Fit</button>
                <button onClick={() => setZoom((value) => Math.min(2.5, value + 0.15))} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black">+</button>
                <button onClick={() => void copyCitation(viewer)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black">Copy citation</button>
                {pdfDocsRef.current[viewer.record] && <button onClick={() => openNativePdf(viewer)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black">Open PDF ↗</button>}
                {pdfDocsRef.current[viewer.record] && <button onClick={savePng} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">Save page PNG</button>}
                <button onClick={() => setViewer(null)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">Close</button>
              </div>
            </div>
            <div ref={canvasWrapRef} className="min-h-[60vh] overflow-auto p-3 text-center sm:p-6">
              {!pdfDocsRef.current[viewer.record] ? (
                <div className="mx-auto my-20 max-w-md rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6 text-sm leading-7 text-amber-100">
                  Load the original {viewer.record} PDF using the file selector. The search result is indexed, but the private source file is intentionally not hosted.
                </div>
              ) : (
                <>
                  {rendering && <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Rendering original page…</div>}
                  <canvas ref={canvasRef} className="mx-auto max-w-none bg-white shadow-2xl" />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
