"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bug, BookOpen, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GREETINGS = [
  { word: "Hello", lang: "English" },
  { word: "नमस्ते", lang: "Hindi" },
  { word: "こんにちは", lang: "Japanese" },
  { word: "Hola", lang: "Spanish" },
  { word: "Bonjour", lang: "French" },
  { word: "Hallo", lang: "German" },
  { word: "你好", lang: "Mandarin" },
];

const CODE_LINES = [
  "function binarySearch(arr, target) {",
  "  let left = 0, right = arr.length - 1;",
  "  while (left <= right) {",
  "    const mid = (left + right) >> 1;",
  "    if (arr[mid] === target) return mid;",
  "    arr[mid] < target ? left = mid + 1 : right = mid - 1;",
  "  }",
  "  return -1;",
  "}",
];

const PILLARS = [
  {
    icon: PenLine,
    title: "Write",
    body: "Describe what you need in plain words. Get working code dropped straight into your file.",
  },
  {
    icon: BookOpen,
    title: "Read",
    body: "Paste something unfamiliar and get it explained, step by step, in the language you think in.",
  },
  {
    icon: Bug,
    title: "Debug",
    body: "Find what's broken, understand why, and apply the fix with one click.",
  },
];

function RevealWords({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <span
            className="anim-word inline-block"
            style={{ animationDelay: `${delay + i * 90}ms` }}
          >
            {w}&nbsp;
          </span>
        </span>
      ))}
    </>
  );
}

export default function Landing() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    router.prefetch("/lab");
    const t = setInterval(() => setIdx((i) => (i + 1) % GREETINGS.length), 2200);
    return () => clearInterval(t);
  }, [router]);

  // Bfcache protection & auto-dismiss so the user never gets stuck when navigating back
  useEffect(() => {
    setLaunching(false);

    const handlePageShow = (e: PageTransitionEvent) => {
      setLaunching(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    if (launching) {
      const timer = setTimeout(() => {
        setLaunching(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [launching]);

  const launch = () => {
    if (launching) return;
    setLaunching(true);
    router.push("/lab");
  };

  const g = GREETINGS[idx];

  return (
    <div className={cn("relative min-h-screen overflow-x-clip", launching && "anim-content-exit")}>
      {/* Top Hairline Progress Bar */}
      {launching && (
        <div className="fixed top-0 left-0 right-0 z-[120] h-[2px] bg-vermilion anim-top-progress shadow-[0_0_8px_rgba(207,63,27,0.6)]" />
      )}

      {/* Cinematic Editorial Veil */}
      {launching && (
        <div
          role="status"
          aria-live="polite"
          onClick={() => setLaunching(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-md anim-ink-veil cursor-pointer"
        >
          <div className="border border-foreground bg-card px-8 py-6 shadow-2xl anim-badge-emerge flex flex-col items-center gap-3 select-none">
            <span className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              PolyGlot <span className="font-normal italic">Code-Lab</span>
            </span>
            <div className="flex items-center gap-2.5 font-mono text-xs text-muted-foreground">
              <span className="size-1.5 animate-ping bg-vermilion" />
              <span>Opening workbench…</span>
            </div>
          </div>
        </div>
      )}

      {/* Masthead */}
      <header className="anim-fade border-b border-foreground">
        <div className="mx-auto flex max-w-[1400px] items-baseline justify-between px-4 sm:px-6 py-4">
          <span className="font-heading text-xl sm:text-2xl font-semibold tracking-tight">
            PolyGlot <span className="font-normal italic">Code-Lab</span>
          </span>
          <button
            onClick={launch}
            className="text-xs sm:text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline cursor-pointer"
          >
            Skip to the lab →
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1400px] gap-8 sm:gap-12 px-4 sm:px-6 pt-10 sm:pt-16 pb-14 sm:pb-20 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
        <div className="flex flex-col">
          {/* Rotating greeting */}
          <div className="flex h-8 items-center gap-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
            <span className="anim-rule h-px w-10 bg-foreground" />
            <span key={g.lang} className="anim-fade">
              {g.lang}
            </span>
          </div>
          <div className="mt-2 sm:mt-4 h-[1.15em] overflow-hidden font-heading text-[clamp(2.75rem,10vw,8.5rem)] leading-[1.1] font-medium tracking-tight text-vermilion italic">
            <div key={g.word} className="anim-word">
              {g.word}
            </div>
          </div>

          <h1 className="mt-6 sm:mt-8 max-w-2xl font-heading text-3xl sm:text-4xl leading-[1.08] font-medium tracking-tight md:text-5xl">
            <RevealWords text="Write it. Read it. Debug it." delay={300} />
            <br />
            <span className="text-muted-foreground">
              <RevealWords text="In any language." delay={750} />
            </span>
          </h1>

          <p
            className="anim-rise mt-4 sm:mt-6 max-w-lg text-[15px] sm:text-[17px] leading-7 sm:leading-8 text-muted-foreground"
            style={{ animationDelay: "1100ms" }}
          >
            A pair programmer that lives in your editor and answers in the
            language you actually think in — from English to Hindi, Japanese
            and beyond.
          </p>

          <div
            className="anim-rise mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-5"
            style={{ animationDelay: "1300ms" }}
          >
            <Button size="lg" onClick={launch} className="group gap-3 text-base tracking-normal normal-case cursor-pointer">
              Launch the lab
              <ArrowRight className="size-4! transition-transform group-hover:translate-x-1" />
            </Button>
            <span className="font-mono text-xs text-muted-foreground">
              no sign-up · just paste and go
            </span>
          </div>
        </div>

        {/* Code window */}
        <div
          className="anim-rise self-center w-full border border-foreground bg-card shadow-[6px_6px_0_0_var(--ink)] sm:shadow-[10px_10px_0_0_var(--ink)]"
          style={{ animationDelay: "700ms" }}
          aria-hidden
        >
          <div className="flex items-center justify-between border-b border-foreground bg-secondary px-3 sm:px-4 py-2 font-mono text-xs">
            <span>binary_search.js</span>
            <span className="text-muted-foreground">javascript</span>
          </div>
          <pre className="overflow-x-auto px-3 sm:px-4 py-4 font-mono text-[11.5px] sm:text-[12.5px] leading-5 sm:leading-6">
            {CODE_LINES.map((l, i) => (
              <div
                key={i}
                className="anim-line flex gap-3 sm:gap-4"
                style={{ animationDelay: `${1000 + i * 140}ms` }}
              >
                <span className="w-4 text-right text-muted-foreground/60 select-none">
                  {i + 1}
                </span>
                <span className="whitespace-pre">{l}</span>
              </div>
            ))}
            <span className="anim-caret ml-8 inline-block h-4 w-[7px] translate-y-0.5 bg-vermilion" />
          </pre>
          <div
            className="anim-rise border-t border-foreground bg-background px-3 sm:px-4 py-4"
            style={{ animationDelay: "2500ms" }}
          >
            <p className="font-mono text-[11px] tracking-widest text-vermilion uppercase">
              PolyGlot · हिन्दी
            </p>
            <p className="mt-2 text-[14px] sm:text-[15px] leading-6 sm:leading-7">
              यह फ़ंक्शन क्रमबद्ध सूची को बार-बार आधा बाँटकर लक्ष्य खोजता है — हर
              चरण में खोज का दायरा आधा हो जाता है।
            </p>
          </div>
        </div>
      </section>

      {/* Language ticker */}
      <div className="overflow-hidden border-y border-foreground bg-foreground py-2.5 sm:py-3 text-background">
        <div className="anim-marquee flex w-max gap-8 sm:gap-12 whitespace-nowrap font-heading text-lg sm:text-xl italic">
          {[...GREETINGS, ...GREETINGS, ...GREETINGS, ...GREETINGS].map((x, i) => (
            <span key={i} className="flex items-center gap-8 sm:gap-12">
              {x.word}
              <span className="text-vermilion not-italic">✺</span>
            </span>
          ))}
        </div>
      </div>

      {/* Pillars */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid divide-y divide-foreground border border-foreground md:grid-cols-3 md:divide-x md:divide-y-0">
          {PILLARS.map((p, i) => (
            <article
              key={p.title}
              className="group bg-card p-6 sm:p-8 transition-colors hover:bg-foreground hover:text-background"
            >
              <div className="flex items-center justify-between">
                <p.icon className="size-6" strokeWidth={1.5} />
                <span className="font-mono text-xs text-muted-foreground group-hover:text-background/60">
                  0{i + 1}
                </span>
              </div>
              <h2 className="mt-6 sm:mt-10 font-heading text-2xl sm:text-3xl font-medium tracking-tight">
                {p.title}
              </h2>
              <p className="mt-3 max-w-xs text-[14px] sm:text-[15px] leading-6 sm:leading-7 text-muted-foreground group-hover:text-background/70">
                {p.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 sm:mt-16 flex flex-col items-start justify-between gap-6 border-b border-foreground pb-12 sm:pb-16 md:flex-row md:items-end">
          <h2 className="max-w-2xl font-heading text-3xl sm:text-4xl leading-tight font-medium tracking-tight md:text-5xl">
            Your editor, with a teammate who speaks{" "}
            <span className="italic text-vermilion">your</span> language.
          </h2>
          <Button size="lg" onClick={launch} className="gap-3 text-base tracking-normal normal-case cursor-pointer">
            Open the lab <ArrowRight className="size-4!" />
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 sm:px-6 pb-8 text-xs sm:text-sm text-muted-foreground">
        <span>Built for Nexathon · Tracks 04 &amp; 05</span>
        <span className="flex gap-5">
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
        </span>
      </footer>
    </div>
  );
}