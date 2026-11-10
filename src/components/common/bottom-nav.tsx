"use client";

import {
  IconCalendar,
  IconChecklist,
  IconNotes,
  IconRoad,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/today", label: "Today", icon: IconCalendar },
    { href: "/roadmap", label: "Roadmap", icon: IconRoad },
    { href: "/review", label: "Review", icon: IconChecklist },
    { href: "/notes", label: "Notes", icon: IconNotes },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`flex items-center justify-center p-1 rounded-full transition-transform ${
                  isActive ? "bg-primary-soft scale-110" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
