"use client";

import {
  IconCalendar,
  IconChecklist,
  IconLogout,
  IconMoon,
  IconNotes,
  IconRoad,
  IconSettings,
  IconSun,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut, useSession } from "@/lib/auth-client";

export function AppHeader() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const navLinks = [
    { href: "/today", label: "Today", icon: IconCalendar },
    { href: "/roadmap", label: "Roadmap", icon: IconRoad },
    { href: "/review", label: "Review", icon: IconChecklist },
    { href: "/notes", label: "Notes", icon: IconNotes },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/today" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
            <Image
              src="/logo.svg"
              alt="Dhaap Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              Dhaap{" "}
              <span className="text-xs font-normal text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">
                ধাপ
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground -mt-1 font-medium">
              Learning Engine
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/60">
          {navLinks.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-card text-primary shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Toggle Theme"
          >
            {theme === "dark" ? (
              <IconSun className="h-4 w-4" />
            ) : (
              <IconMoon className="h-4 w-4" />
            )}
          </button>

          {/* User Profile / Settings */}
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Settings"
          >
            <IconSettings className="h-4 w-4" />
          </Link>

          {session?.user && (
            <button
              type="button"
              onClick={() => signOut()}
              className="hidden sm:flex h-9 items-center gap-1.5 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive hover:bg-destructive-soft transition-colors"
              title="Sign Out"
            >
              <IconLogout className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
