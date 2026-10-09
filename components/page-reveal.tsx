export function PageReveal() {
  // Ink curtain that lifts off the page when arriving from the landing screen.
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-foreground"
      style={{ animation: "wipe-reveal .9s cubic-bezier(.77,0,.18,1) .15s both" }}
    >
      <span className="font-heading text-3xl font-semibold tracking-tight text-background">
        PolyGlot <span className="font-normal italic">Code-Lab</span>
      </span>
    </div>
  );
}
