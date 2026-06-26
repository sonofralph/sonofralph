"use client";

import { usePathname } from "next/navigation";
import { Bell, LogOut, User, ChevronRight } from "lucide-react";
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

interface HeaderProps {
  user: SessionUser;
  alertCount?: number;
}

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/inventory": "Inventory",
  "/dashboard/movements": "Stock Movements",
  "/dashboard/purchase-orders": "Purchase Orders",
  "/dashboard/purchase-orders/new": "New Purchase Order",
  "/dashboard/suppliers": "Suppliers",
  "/dashboard/locations": "Locations",
  "/dashboard/alerts": "Alerts",
  "/dashboard/reports": "Reports",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/team": "Team Management",
};

export function Header({ user, alertCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = routeLabels[pathname] ?? "Dashboard";

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    return { label: routeLabels[href] ?? seg, href };
  });

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
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

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </Button>

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
