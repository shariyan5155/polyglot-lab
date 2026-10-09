"use client";

import { Fragment } from "react";
import { Check, Copy, FileInput, Replace } from "lucide-react";
import { useState } from "react";

/**
 * Minimal renderer for the model's reply: fenced code blocks (with actions),
 * bullet lists, headings, **bold** and `inline code`. No markdown dependency.
 */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return (
            <strong key={i} className="font-semibold text-foreground">
              {p.slice(2, -2)}
            </strong>
          );
        if (p.startsWith("`") && p.endsWith("`"))
          return (
            <code
              key={i}
              className="border border-border bg-secondary px-1 py-px font-mono text-[0.85em]"
            >
              {p.slice(1, -1)}
            </code>
          );
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function TextBlock({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} className="space-y-2">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-[0.8em] h-px w-3 shrink-0 bg-foreground" />
                  <span>
                    <Inline text={l.replace(/^\s*([-*•]|\d+\.)\s+/, "")} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        const heading = block.match(/^#{1,4}\s+(.*)$/);
        if (heading) {
          return (
            <h3
              key={i}
              className="pt-2 font-heading text-lg font-semibold tracking-tight"
            >
              <Inline text={heading[1]} />
            </h3>
          );
        }
        return (
          <p key={i}>
            <Inline text={block} />
          </p>
        );
      })}
    </>
  );
}

function CodeBlock({
  lang,
  code,
  onInsert,
  onReplace,
}: {
  lang: string;
  code: string;
  onInsert?: (code: string) => void;
  onReplace?: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const btn =
    "inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground";
  return (
    <div className="border border-foreground bg-background">
      <div className="flex items-center justify-between border-b border-border pl-3">
        <span className="font-mono text-[11px] text-muted-foreground">
          {lang || "code"}
        </span>
        <div className="flex">
          <button
            className={btn}
            onClick={async () => {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          {onInsert && (
            <button className={btn} onClick={() => onInsert(code)}>
              <FileInput className="size-3" /> Insert
            </button>
          )}
          {onReplace && (
            <button className={btn} onClick={() => onReplace(code)}>
              <Replace className="size-3" /> Replace file
            </button>
          )}
        </div>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-foreground">
        {code}
      </pre>
    </div>
  );
}

export function OutputView({
  text,
  onInsert,
  onReplace,
}: {
  text: string;
  onInsert?: (code: string) => void;
  onReplace?: (code: string) => void;
}) {
  // split() with two capture groups cycles: text, lang, code, text, lang, code…
  const chunks = text.split(/```([\w+#.-]*)[ \t]*\n?([\s\S]*?)```/g);
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < chunks.length; i += 3) {
    nodes.push(<TextBlock key={`t${i}`} text={chunks[i] ?? ""} />);
    if (i + 2 < chunks.length) {
      nodes.push(
        <CodeBlock
          key={`c${i}`}
          lang={chunks[i + 1]}
          code={(chunks[i + 2] ?? "").replace(/\n$/, "")}
          onInsert={onInsert}
          onReplace={onReplace}
        />
      );
    }
  }
  return (
    <div className="space-y-4 text-[15px] leading-7 text-foreground/90">
      {nodes}
    </div>
  );
}
