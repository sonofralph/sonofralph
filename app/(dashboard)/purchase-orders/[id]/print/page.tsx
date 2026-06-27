import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SessionUser } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PrintPOPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;

  const [po, org] = await Promise.all([
    prisma.purchaseOrder.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        supplier: true,
        lines: {
          include: { item: { select: { name: true, sku: true, unit: true } } },
        },
      },
    }),
    prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true },
    }),
  ]);

  if (!po) notFound();

  const subtotal = po.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 20mm; }
          .no-print { display: none !important; }
          body { font-family: sans-serif; color: #0f172a; }
        }
        body { font-family: sans-serif; background: #f8fafc; }
      `}</style>

      {/* Print / Back buttons — hidden when printing */}
      <div className="no-print flex items-center gap-3 p-6 border-b border-slate-200 bg-white">
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Printable document */}
      <div className="max-w-3xl mx-auto bg-white p-10 my-8 shadow-sm rounded-xl no-print:rounded-xl print:shadow-none print:my-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{org?.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">Purchase Order</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">PO-{po.id.slice(-6).toUpperCase()}</p>
            <span className="inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600">
              {po.status}
            </span>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Supplier</p>
            <p className="font-semibold text-slate-900">{po.supplier.name}</p>
            {po.supplier.contact && <p className="text-sm text-slate-600">{po.supplier.contact}</p>}
            {po.supplier.email && <p className="text-sm text-slate-600">{po.supplier.email}</p>}
            {po.supplier.phone && <p className="text-sm text-slate-600">{po.supplier.phone}</p>}
            {po.supplier.address && <p className="text-sm text-slate-500 mt-1">{po.supplier.address}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Order Details</p>
            <p className="text-sm text-slate-600">Order date: <span className="font-medium text-slate-900">{formatDate(po.orderDate)}</span></p>
            {po.expectedDate && (
              <p className="text-sm text-slate-600">Expected: <span className="font-medium text-slate-900">{formatDate(po.expectedDate)}</span></p>
            )}
          </div>
        </div>

        {/* Line items */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
              <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">SKU</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit Cost</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody>
            {po.lines.map((line, i) => (
              <tr key={line.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="py-2.5 font-medium text-slate-900">{line.item.name}</td>
                <td className="py-2.5 text-slate-500 font-mono text-xs">{line.item.sku}</td>
                <td className="py-2.5 text-right text-slate-700">{line.quantity}</td>
                <td className="py-2.5 text-right text-slate-500">{line.item.unit}</td>
                <td className="py-2.5 text-right text-slate-700">{formatCurrency(line.unitCost)}</td>
                <td className="py-2.5 text-right font-medium text-slate-900">{formatCurrency(line.quantity * line.unitCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-56 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2 mt-2">
              <span>Total</span>
              <span className="text-indigo-600">{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {po.notes && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 mb-8">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-slate-700">{po.notes}</p>
          </div>
        )}

        {/* Signature line */}
        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-100">
          <div>
            <div className="h-10 border-b border-slate-300 mb-1" />
            <p className="text-xs text-slate-400">Authorised by</p>
          </div>
          <div>
            <div className="h-10 border-b border-slate-300 mb-1" />
            <p className="text-xs text-slate-400">Date</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-300 mt-10">
          Generated by Stockwise · {new Date().toLocaleDateString()}
        </p>
      </div>
    </>
  );
}
