"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ArrowLeftRight, ShoppingCart,
  Truck, MapPin, Bell, BarChart3, Settings, Users, ChefHat,
  UtensilsCrossed, Shield, X, RefreshCw, ClipboardList, Trash2, Zap, Target, Palette, Rocket, Building2,
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
  { label: "Requisitions",    href: "/requisitions",    icon: ClipboardList,   roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"] },
  { label: "Handovers",       href: "/handovers",       icon: ArrowLeftRight,  roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"] },
  { label: "Transfer",        href: "/transfer",        icon: ArrowLeftRight,  roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart,    roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Suppliers",       href: "/suppliers",       icon: Truck,           roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Recipes",         href: "/recipes",         icon: UtensilsCrossed, roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Locations",       href: "/locations",       icon: MapPin,          roles: ["OWNER", "ADMIN"] },
  { label: "Alerts",          href: "/alerts",          icon: Bell,            roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Stocktake",       href: "/stocktake",       icon: ClipboardList,   roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Wastage",         href: "/wastage",         icon: Trash2,          roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Par Levels",      href: "/par-levels",      icon: Target,          roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Reorder",         href: "/reorder",         icon: RefreshCw,       roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Reports",         href: "/reports",         icon: BarChart3,       roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Departments",      href: "/departments",      icon: Building2,       roles: ["OWNER", "ADMIN"] },
  { label: "Audit Log",       href: "/audit",           icon: Shield,          roles: ["OWNER", "ADMIN"] },
  { label: "Team",            href: "/settings/team",      icon: Users,       roles: ["OWNER", "ADMIN"] },
  { label: "Settings",        href: "/settings",           icon: Settings,    roles: ["OWNER", "ADMIN"] },
  { label: "Billing",         href: "/settings/billing",   icon: CreditCard,  roles: ["OWNER"] },
  { label: "Branding",        href: "/settings/branding",  icon: Palette,     roles: ["OWNER"] },
  { label: "Notifications",   href: "/settings/notifications", icon: Bell,     roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"] },
  { label: "Go Live",         href: "/go-live",                icon: Rocket,   roles: ["OWNER", "ADMIN"] },
];

const navGroups = [
  { label: "Operations",  keys: ["Dashboard", "Inventory", "Stock Movements", "Quick Movement", "Requisitions", "Handovers", "Transfer"] },
  { label: "Procurement", keys: ["Purchase Orders", "Suppliers"] },
  { label: "Management",  keys: ["Recipes", "Locations", "Alerts", "Stocktake", "Wastage", "Par Levels", "Reorder", "Reports"] },
  { label: "Admin",       keys: ["Departments", "Audit Log", "Team", "Settings", "Billing", "Branding"] },
  { label: "Account",     keys: ["Notifications"] },
  { label: "Setup",       keys: ["Go Live"] },
];

interface SidebarProps {
  userRole: UserRole;
  orgName: string;
  onClose?: () => void;
  logoUrl?: string | null;
  brandColor?: string;
}

export function Sidebar({ userRole, orgName, onClose, logoUrl, brandColor = "#4f46e5" }: SidebarProps) {
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
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm overflow-hidden shrink-0"
          style={{ backgroundColor: logoUrl ? "transparent" : brandColor }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded-lg" />
          ) : (
            <ChefHat className="h-4 w-4 text-white" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{orgName}</p>
          <p className="text-[11px] text-slate-400">Inventory Management</p>
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
                          isActive ? "text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                        style={isActive ? { backgroundColor: brandColor } : undefined}
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
        <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: `${brandColor}15`, border: `1px solid ${brandColor}30` }}>
          <p className="text-xs font-semibold" style={{ color: brandColor }}>Mise Pro</p>
          <p className="text-[11px] text-slate-400">Hospitality IMS · v1.0</p>
        </div>
      </div>
    </aside>
  );
}
