import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-foreground">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-heading text-xl font-semibold tracking-tight hover:opacity-80">
            PolyGlot <span className="italic font-normal">Code-Lab</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Back to home
            </Link>
            <Link
              href="/lab"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-mono border border-border px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-foreground"
            >
              Open Lab →
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Last updated {updated}
        </p>
        <h1 className="mt-3 border-b border-border pb-8 font-heading text-5xl font-medium tracking-tight">
          {title}
        </h1>
        <div className="mt-8 space-y-5 text-[15px] leading-7 text-foreground/85">
          {children}
        </div>
        <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Return to launching page
          </Link>
          <Link
            href="/lab"
            className="text-xs font-mono text-muted-foreground hover:text-foreground"
          >
            Launch the lab →
          </Link>
        </div>
      </main>
    </div>
  );
}
