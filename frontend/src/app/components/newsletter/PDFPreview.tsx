"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Download } from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFPreviewProps {
  pdfUrl: string;
  maxPages?: number;
  onDownloadClick: () => void;
  isAuthenticated: boolean;
}

const MAX_PAGE_WIDTH = 560;
const MIN_PAGE_WIDTH = 260;

function getPageWidth(containerWidth: number) {
  return Math.max(
    MIN_PAGE_WIDTH,
    Math.min(MAX_PAGE_WIDTH, Math.floor(containerWidth - 24))
  );
}

export default function PDFPreview({
  pdfUrl,
  maxPages = 2,
  onDownloadClick,
  isAuthenticated,
}: PDFPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState(MAX_PAGE_WIDTH);

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    const updatePageWidth = () => {
      setPageWidth(getPageWidth(wrapper.clientWidth));
    };

    updatePageWidth();

    const resizeObserver = new ResizeObserver(updatePageWidth);
    resizeObserver.observe(wrapper);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="pdf-preview-wrapper mx-auto w-full max-w-[620px]"
    >
      <Document
        file={pdfUrl}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          setLoading(false);
        }}
        onLoadError={(error) => {
          console.error("[PDF Preview] Error loading PDF:", error);
          setLoading(false);
        }}
        loading={
          <div className="flex h-[420px] w-full animate-pulse items-center justify-center rounded-xl border border-muted/20 bg-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Chargement de la liseuse...
            </p>
          </div>
        }
        className="pdf-document"
      >
        <div className="space-y-6">
          {!loading &&
            Array.from(new Array(Math.min(maxPages, numPages)), (_, i) => (
              <div
                key={`page_${i + 1}`}
                className="pdf-page-container flex justify-center"
              >
                <Page
                  pageNumber={i + 1}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="pdf-page overflow-hidden rounded-lg border border-muted/20 bg-white shadow-sm"
                />
              </div>
            ))}
        </div>
      </Document>

      {(!isAuthenticated || numPages > maxPages) && (
        <div className="relative mt-6">
          {numPages > maxPages && (
            <div className="absolute inset-x-4 -top-20 h-20 border-t border-dashed border-muted/30 bg-white/70 backdrop-blur-sm" />
          )}

          <div className="relative z-10 rounded-xl bg-primary px-5 py-6 text-center text-white shadow-sm sm:px-6">
            {isAuthenticated ? (
              <p className="text-xs font-bold uppercase tracking-widest text-white/75">
                +{numPages - maxPages} pages dans l’édition complète
              </p>
            ) : (
              <div className="space-y-2">
                <p className="mx-auto max-w-sm text-sm font-semibold leading-relaxed text-white">
                  Connectez-vous pour lire la newsletter
                  complète.
                </p>
              </div>
            )}
            <button
              onClick={onDownloadClick}
              className="mt-4 inline-flex items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-wide text-foreground transition hover:bg-accent hover:text-black"
            >
              <Download className="h-4 w-4" />
              {isAuthenticated
                ? "Télécharger le PDF complet"
                : "Se connecter pour lire la newsletter"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
