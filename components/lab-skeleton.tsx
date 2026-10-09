"use client";

import { Files, PenLine, BookOpen, Bug } from "lucide-react";

export function LabSkeleton() {
  return (
    <div className="flex h-screen h-[100dvh] flex-col overflow-hidden bg-background text-foreground select-none">
      {/* Title Bar Skeleton */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-foreground px-2 sm:px-4 bg-card">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="font-heading text-base sm:text-lg font-semibold tracking-tight">
            PolyGlot <span className="font-normal italic">Code-Lab</span>
          </div>
          <span className="hidden text-xs text-muted-foreground border-l border-border pl-4 xl:inline font-mono">
            Multi-language AI Engine
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-7 w-16 sm:w-24 bg-emerald-950/20 border border-emerald-900/30 animate-pulse" />
          <div className="h-7 w-12 sm:w-20 bg-muted/40 border border-border animate-pulse" />
          <div className="hidden sm:block h-4 w-px bg-border mx-0.5" />
          <div className="h-7 w-20 sm:w-28 bg-muted/40 border border-border animate-pulse" />
        </div>
      </header>

      {/* Main Workspace Skeleton */}
      <div className="flex flex-1 min-h-0 flex-col lg:grid lg:grid-cols-[48px_220px_minmax(0,1fr)_minmax(360px,32%)]">
        {/* Left Activity Bar */}
        <aside className="hidden lg:flex w-12 shrink-0 flex-col items-center justify-between border-r border-foreground bg-card py-3">
          <div className="flex flex-col items-center gap-4">
            <div className="p-2 border-l-2 border-foreground text-foreground">
              <Files className="size-5" />
            </div>
          </div>
          <div className="size-2 rounded-full bg-emerald-500/80 animate-pulse" />
        </aside>

        {/* Explorer Sidebar */}
        <nav className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border bg-card">
          <div className="flex h-9 items-center justify-between border-b border-border px-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Explorer</span>
          </div>
          <div className="p-2 space-y-1">
            <div className="h-7 w-full bg-secondary border border-border animate-pulse" />
            <div className="h-7 w-full bg-transparent" />
            <div className="h-7 w-full bg-transparent" />
          </div>
        </nav>

        {/* Editor Area */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          {/* Tabs Bar */}
          <div className="flex h-9 shrink-0 items-center border-b border-foreground bg-card px-2 gap-1">
            <div className="h-7 w-28 sm:w-32 border border-foreground border-b-background bg-background px-3 flex items-center gap-2">
              <div className="size-2 rounded-full bg-foreground/40" />
              <div className="h-3 w-16 bg-foreground/20 animate-pulse" />
            </div>
            <div className="hidden sm:flex h-7 w-28 border border-border bg-card px-3 items-center gap-2 opacity-50">
              <div className="size-2 rounded-full bg-foreground/20" />
              <div className="h-3 w-14 bg-foreground/10" />
            </div>
          </div>

          {/* Canvas Area */}
          <div className="relative min-h-0 flex-1 bg-[#FAF8F2] p-4 sm:p-6 font-mono text-sm">
            <div className="space-y-3 max-w-xl">
              <div className="h-4 w-3/4 bg-[#E5DFC9] animate-pulse" />
              <div className="h-4 w-1/2 bg-[#E5DFC9] animate-pulse" />
              <div className="h-4 w-5/6 bg-[#E5DFC9] animate-pulse" />
              <div className="h-4 w-2/3 bg-[#E5DFC9] animate-pulse" />
              <div className="h-4 w-1/3 bg-[#E5DFC9] animate-pulse" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="border border-foreground bg-background px-4 py-2 font-mono text-xs shadow-sm flex items-center gap-2.5 max-w-xs text-center">
                <span className="size-2 animate-ping bg-vermilion shrink-0" />
                <span className="truncate">Loading workbench environment…</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Assistant Column */}
        <aside className="hidden lg:flex w-[360px] shrink-0 flex-col border-l border-foreground bg-card">
          <div className="flex h-11 border-b border-foreground">
            <div className="flex-1 flex items-center justify-center gap-2 border-r border-border bg-foreground text-background font-mono text-xs">
              <PenLine className="size-3.5" /> Write
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 border-r border-border text-muted-foreground font-mono text-xs">
              <BookOpen className="size-3.5" /> Read
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground font-mono text-xs">
              <Bug className="size-3.5" /> Debug
            </div>
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="h-6 w-48 bg-muted animate-pulse" />
            <div className="h-4 w-36 bg-muted/60 animate-pulse" />
            <div className="mt-8 space-y-2">
              <div className="h-8 w-full border border-border bg-background animate-pulse" />
              <div className="h-8 w-full border border-border bg-background animate-pulse" />
            </div>
          </div>
          <div className="h-28 border-t border-foreground p-3 bg-background">
            <div className="h-full border border-border bg-card animate-pulse" />
          </div>
        </aside>
      </div>

      {/* Bottom Status Bar */}
      <footer className="flex h-6 shrink-0 items-center justify-between bg-foreground px-2 sm:px-3 font-mono text-[11px] text-background">
        <div className="flex items-center gap-2">
          <span className="size-1.5 bg-background" />
          <span>initializing</span>
        </div>
        <div>
          <span>PolyGlot Engine</span>
        </div>
      </footer>
    </div>
  );
}
