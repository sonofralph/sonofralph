import { Badge } from "@/components/ui/badge";
import { getStockStatus } from "@/lib/utils";

interface StockBadgeProps {
  quantity: number;
  reorderPoint: number;
  minStock: number;
  unit?: string;
  showQty?: boolean;
}

export function StockBadge({
  quantity,
  reorderPoint,
  minStock,
  unit = "",
  showQty = true,
}: StockBadgeProps) {
  const status = getStockStatus(quantity, reorderPoint, minStock);

  const config = {
    ok: { variant: "success" as const, label: "In Stock" },
    low: { variant: "warning" as const, label: "Low Stock" },
    critical: { variant: "danger" as const, label: "Critical" },
  };

  const { variant, label } = config[status];

  return (
    <div className="flex items-center gap-2">
      {showQty && (
        <span className="text-sm font-medium text-slate-900">
          {quantity.toLocaleString()}
          {unit && (
            <span className="ml-1 text-xs text-slate-500">{unit}</span>
          )}
        </span>
      )}
      <Badge variant={variant}>{label}</Badge>
    </div>
  );
}
