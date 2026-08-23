"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Boxes,
  LayoutDashboard,
  Mail,
  Menu,
  Receipt,
  Truck,
  Users,
  Wine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import type { SessionEmployee } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: Receipt },
  { href: "/catalog", label: "Catalog", icon: Boxes },
  { href: "/cash", label: "Cash flow", icon: Banknote },
  { href: "/vendors", label: "Vendors", icon: Truck },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/marketing", label: "Marketing", icon: Mail },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar({ employee }: { employee: SessionEmployee }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
      <Brand />
      <div className="mt-6 flex-1">
        <NavLinks />
      </div>
      <EmployeeFooter employee={employee} />
    </aside>
  );
}

export function MobileNav({ employee }: { employee: SessionEmployee }) {
  return (
    <header className="flex items-center justify-between border-b bg-sidebar px-4 py-3 md:hidden">
      <Brand compact />
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <Brand />
          <div className="mt-6">
            <NavLinks />
          </div>
          <div className="mt-8">
            <EmployeeFooter employee={employee} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
        <Wine className="size-4" />
      </span>
      {!compact && (
        <span className="font-semibold tracking-tight">
          Barly <span className="text-muted-foreground font-normal">Admin</span>
        </span>
      )}
    </Link>
  );
}

function EmployeeFooter({ employee }: { employee: SessionEmployee }) {
  return (
    <div className="space-y-3 border-t pt-4">
      <div>
        <p className="text-sm font-medium">{employee.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{employee.role}</p>
      </div>
      <form action={logoutAction}>
        <Button variant="outline" size="sm" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
