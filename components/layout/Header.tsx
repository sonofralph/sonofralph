"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, User, ChevronRight, AlertTriangle, Package, Menu } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionUser } from "@/types";
import { cn } from "@/lib/utils";

interface AlertPreview {
  id: string;
  type: string;
  message: string | null;
  itemName: string;
  locationName: string;
  createdAt: Date;
}

interface HeaderProps {
  user: SessionUser;
  alertCount?: number;
  alerts?: AlertPreview[];
  onMenuToggle?: () => void;
}

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Inventory",
  "/movements": "Stock Movements",
  "/purchase-orders": "Purchase Orders",
  "/purchase-orders/new": "New Purchase Order",
  "/suppliers": "Suppliers",
  "/locations": "Locations",
  "/alerts": "Alerts",
  "/reports": "Reports",
  "/settings": "Settings",
  "/settings/team": "Team Management",
  "/recipes": "Recipes & Food Cost",
  "/recipes/new": "New Recipe",
  "/audit": "Audit Log",
};

export function Header({ user, alertCount = 0, alerts = [], onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    return { label: routeLabels[href] ?? seg, href };
  });

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button onClick={onMenuToggle} className="md:hidden rounded-lg p-1.5 hover:bg-slate-100">
          <Menu className="h-5 w-5 text-slate-600" />
        </button>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? "font-semibold text-slate-900"
                  : "text-slate-500"
              }
            >
              {crumb.label}
            </span>
          </div>
        ))}
      </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <GlobalSearch />
        {/* Notifications dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {alertCount > 0 && (
                <span className="text-xs font-normal text-slate-500">
                  {alertCount} open
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500">
                No open alerts
              </div>
            ) : (
              alerts.slice(0, 4).map((alert) => (
                <DropdownMenuItem
                  key={alert.id}
                  className="flex flex-col items-start gap-0.5 px-3 py-2.5 cursor-pointer"
                  onClick={() => router.push(`/alerts`)}
                >
                  <div className="flex w-full items-center gap-2">
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        alert.type === "OUT_OF_STOCK"
                          ? "bg-red-100"
                          : "bg-amber-100"
                      )}
                    >
                      {alert.type === "OUT_OF_STOCK" ? (
                        <Package className="h-3 w-3 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-xs font-medium text-slate-900">
                      {alert.itemName}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        alert.type === "OUT_OF_STOCK"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {alert.type === "OUT_OF_STOCK" ? "Out of stock" : "Low stock"}
                    </span>
                  </div>
                  <p className="ml-8 text-xs text-slate-500 truncate w-full">
                    {alert.locationName}
                  </p>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-xs font-medium text-indigo-600 focus:text-indigo-600 cursor-pointer"
              onClick={() => router.push("/alerts")}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-medium text-slate-900">
                  {user.name ?? user.email}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {user.role.toLowerCase()}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user.name ?? "User"}</p>
                <p className="text-xs font-normal text-slate-500">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
              <User className="mr-2 h-4 w-4" />
              Your Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
