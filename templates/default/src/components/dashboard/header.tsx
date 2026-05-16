"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const clerkReady = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function DashboardHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2 md:hidden">
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          <Menu className="h-4 w-4" />
        </Button>
        <Link href="/dashboard" className="font-semibold">
          Syllabus
        </Link>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        {clerkReady ? (
          <>
            <OrganizationSwitcher hidePersonal />
            <UserButton />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">デモモード</span>
        )}
      </div>
      {open && (
        <nav className="absolute left-0 top-14 z-20 w-full border-b border-border bg-card p-3 md:hidden">
          <Link
            href="/dashboard"
            className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
          >
            ダッシュボード
          </Link>
          <Link
            href="/syllabuses"
            className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
          >
            シラバス
          </Link>
        </nav>
      )}
    </header>
  );
}
