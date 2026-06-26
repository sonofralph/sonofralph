"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  MapPin,
  Bell,
  BarChart3,
  Settings,
  Users,
  ChefHat,
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
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"],
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"],
  },
  {
    label: "Stock Movements",
    href: "/movements",
    icon: ArrowLeftRight,
    roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"],
  },
  {
    label: "Purchase Orders",
    href: "/purchase-orders",
    icon: ShoppingCart,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    icon: Truck,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    label: "Locations",
    href: "/locations",
    icon: MapPin,
    roles: ["OWNER", "ADMIN"],
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: Bell,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    label: "Team",
    href: "/settings/team",
    icon: Users,
    roles: ["OWNER", "ADMIN"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["OWNER", "ADMIN"],
  },
];

interface SidebarProps {
  userRole: UserRole;
  orgName: string;
}

export function Sidebar({ userRole, orgName }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <ChefHat className="h-6 w-6 text-indigo-600" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">Stockwise</p>
          <p className="text-xs text-slate-500 truncate">{orgName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-indigo-600" : "text-slate-400"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3">
        <div className="rounded-lg bg-indigo-50 px-3 py-2">
          <p className="text-xs font-medium text-indigo-700">Hospitality IMS</p>
          <p className="text-xs text-indigo-500">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
