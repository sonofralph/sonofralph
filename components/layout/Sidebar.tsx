"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ArrowLeftRight, ShoppingCart,
  Truck, MapPin, Bell, BarChart3, Settings, Users, ChefHat,
  UtensilsCrossed, Shield, X, RefreshCw, ClipboardList, Trash2, Zap, Target, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard",       href: "/dashboard",       icon: LayoutDashboard, roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"] },
  { label: "Inventory",       href: "/inventory",       icon: Package,         roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"] },
  { label: "Stock Movements", href: "/movements",       icon: ArrowLeftRight,  roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"] },
  { label: "Quick Movement",  href: "/quick",           icon: Zap,             roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"] },
  { label: "Transfer",        href: "/transfer",        icon: ArrowLeftRight,  roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart,    roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Suppliers",       href: "/suppliers",       icon: Truck,           roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Recipes",         href: "/recipes",         icon: UtensilsCrossed, roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Locations",       href: "/locations",       icon: MapPin,          roles: ["OWNER", "ADMIN"] },
  { label: "Alerts",          href: "/alerts",          icon: Bell,            roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Stocktake",       href: "/stocktake",       icon: ClipboardList,   roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Wastage",         href: "/wastage",         icon: Trash2,          roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Par Levels",       href: "/par-levels",      icon: Target,          roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Reorder",         href: "/reorder",         icon: RefreshCw,       roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Reports",         href: "/reports",         icon: BarChart3,       roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Audit Log",       href: "/audit",           icon: Shield,          roles: ["OWNER", "ADMIN"] },
  { label: "Team",            href: "/settings/team",   icon: Users,           roles: ["OWNER", "ADMIN"] },
  { label: "Settings",        href: "/settings",        icon: Settings,        roles: ["OWNER", "ADMIN"] },
];

const navGroups = [
  { label: "Operations", keys: ["Dashboard", "Inventory", "Stock Movements", "Quick Movement", "Transfer"] },
  { label: "Procurement", keys: ["Purchase Orders", "Suppliers"] },
  { label: "Management", keys: ["Recipes", "Locations", "Alerts", "Stocktake", "Wastage", "Par Levels", "Reorder", "Reports"] },
  { label: "Admin", keys: ["Audit Log", "Team", "Settings"] },
];

interface SidebarProps {
  userRole: UserRole;
  orgName: string;
  onClose?: () => void;
}

export function Sidebar({ userRole, orgName, onClose }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-100 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        {onClose && (
          <button onClick={onClose} className="md:hidden mr-1 rounded-lg p-1 hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
          <ChefHat className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">Stockwise</p>
          <p className="text-[11px] text-slate-400 truncate">{orgName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => {
          const groupItems = visibleItems.filter((item) => group.keys.includes(item.label));
          if (groupItems.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/dashboard" || item.href === "/settings"
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3">
        <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 px-3 py-2.5">
          <p className="text-xs font-semibold text-indigo-700">Stockwise Pro</p>
          <p className="text-[11px] text-indigo-400">Hospitality IMS · v1.0</p>
        </div>
      </div>
    </aside>
  );
}
