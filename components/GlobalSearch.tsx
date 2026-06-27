"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Building2, ShoppingCart, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResults {
  items: { id: string; name: string; sku: string; unit: string }[];
  suppliers: { id: string; name: string; contact: string | null }[];
  purchaseOrders: { id: string; status: string; supplier: { name: string } }[];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
      setSelectedIdx(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setSelectedIdx(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  type FlatResult = { label: string; sub: string; href: string; icon: React.ElementType };

  const flat: FlatResult[] = results
    ? [
        ...results.items.map((i) => ({
          label: i.name,
          sub: `SKU: ${i.sku}`,
          href: `/inventory/${i.id}`,
          icon: Package,
        })),
        ...results.suppliers.map((s) => ({
          label: s.name,
          sub: s.contact ?? "Supplier",
          href: `/suppliers/${s.id}`,
          icon: Building2,
        })),
        ...results.purchaseOrders.map((p) => ({
          label: `PO-${p.id.slice(-6).toUpperCase()}`,
          sub: p.supplier.name,
          href: `/purchase-orders/${p.id}`,
          icon: ShoppingCart,
        })),
      ]
    : [];

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flat[selectedIdx]) {
      navigate(flat[selectedIdx].href);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500 hover:bg-white hover:border-slate-300 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 text-slate-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search items, suppliers, orders..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <button onClick={() => setOpen(false)} className="rounded p-0.5 hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {flat.length > 0 && (
          <ul className="max-h-72 overflow-y-auto py-2">
            {flat.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <button
                    onMouseEnter={() => setSelectedIdx(i)}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      selectedIdx === i ? "bg-indigo-50" : "hover:bg-slate-50"
                    )}
                  >
                    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", selectedIdx === i ? "bg-indigo-100" : "bg-slate-100")}>
                      <Icon className={cn("h-3.5 w-3.5", selectedIdx === i ? "text-indigo-600" : "text-slate-500")} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.label}</p>
                      <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {query.length >= 2 && !loading && flat.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {!query && (
          <div className="py-8 text-center text-xs text-slate-400">
            Type to search items, suppliers, or purchase orders
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>Esc close</span>
        </div>
      </div>
    </>
  );
}
