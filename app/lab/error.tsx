"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LabError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Lab Error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background px-6 text-foreground text-center">
      <div className="border border-foreground bg-card p-8 max-w-md w-full shadow-sm">
        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
          PolyGlot Workbench
        </span>
        <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
          Page Couldn&apos;t Load
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          The editor encountered a temporary loading hiccup. Click below to reload your files and workspace cleanly.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={() => reset()} size="sm" className="gap-2 cursor-pointer">
            <RotateCw className="size-3.5" />
            Reload Workbench
          </Button>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
              <Home className="size-3.5" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
