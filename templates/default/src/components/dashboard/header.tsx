"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { BookOpen, LayoutDashboard, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const clerkReady = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const nav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/syllabuses", label: "シラバス", icon: BookOpen },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="relative shrink-0 border-b border-border bg-card">
      <div className="flex h-14 items-center gap-4 px-4">
        <Link href="/dashboard" className="shrink-0 font-semibold">
          Syllabus
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {clerkReady ? (
            <>
              <OrganizationSwitcher hidePersonal />
              <UserButton />
            </>
          ) : (
            <span className="text-xs text-muted-foreground">デモモード</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="メニュー"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border p-3 md:hidden">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
