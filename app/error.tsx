"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PolyGlot Runtime caught error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground text-center">
      <div className="border border-foreground bg-card p-8 max-w-md w-full shadow-sm">
        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
          PolyGlot Code-Lab
        </span>
        <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
          Workbench Reload Needed
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          The editor encountered a temporary loading hiccup while restoring your workspace.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={() => reset()} size="sm" className="gap-2 cursor-pointer">
            <RotateCw className="size-3.5" />
            Reload Workspace
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
