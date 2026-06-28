import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  /** Base URL — pagination params are appended. Existing non-page params are preserved. */
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}

function buildHref(basePath: string, page: number, existing: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(existing)) {
    if (v && k !== "page") params.set(k, v);
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export function PaginationBar({ page, totalPages, total, pageSize, basePath, searchParams = {} }: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const linkBase = "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors";
  const active = `${linkBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900`;
  const disabled = `${linkBase} text-slate-300 cursor-not-allowed pointer-events-none`;

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total.toLocaleString()}</span> entries
      </p>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link href={buildHref(basePath, page - 1, searchParams)} className={active}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Link>
        ) : (
          <span className={disabled}><ChevronLeft className="h-4 w-4" /> Previous</span>
        )}
        <span className="text-sm text-slate-500">
          Page {page} of {totalPages}
        </span>
        {hasNext ? (
          <Link href={buildHref(basePath, page + 1, searchParams)} className={active}>
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={disabled}>Next <ChevronRight className="h-4 w-4" /></span>
        )}
      </div>
    </div>
  );
}
