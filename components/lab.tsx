"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import {
  Bug,
  BookOpen,
  CornerDownLeft,
  FileCode2,
  Files,
  FileUp,
  FolderOpen,
  Loader2,
  PenLine,
  Play,
  Plus,
  RotateCw,
  Sparkles,
  Terminal,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OutputView } from "@/components/output-view";
import { cn } from "@/lib/utils";

type Mode = "write" | "explain" | "diagnose";
type FileEntry = { id: string; name: string; language: string; code: string };

type TerminalLog = {
  id: string;
  type: "log" | "error" | "warn" | "info" | "system";
  text: string;
  time: string;
};

const LANGUAGES = [
  "English",
  "Hindi",
  "Japanese",
  "Spanish",
  "French",
  "German",
  "Mandarin",
];

const EXT_LANG: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  cs: "csharp",
  go: "go",
  rs: "rust",
  rb: "ruby",
  php: "php",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  sh: "shell",
  sql: "sql",
};

const languageFor = (name: string) =>
  EXT_LANG[name.split(".").pop()?.toLowerCase() ?? ""] ?? "plaintext";

const INITIAL_FILES: FileEntry[] = [
  {
    id: "f1",
    name: "binary_search.js",
    language: "javascript",
    code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}

// Test Run
const numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("Searching for 23:", binarySearch(numbers, 23));
console.log("Searching for 99 (not in list):", binarySearch(numbers, 99));
`,
  },
  {
    id: "f2",
    name: "fetch_user.js",
    language: "javascript",
    code: `async function fetchUserData(userId) {
  const res = fetch("https://api.example.com/users/" + userId);
  // the response is used before it has resolved
  console.log("User name: " + res.data?.name);
  return res;
}
`,
  },
  {
    id: "f3",
    name: "add_tag.py",
    language: "python",
    code: `def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags

print(add_tag("a"))
print(add_tag("b"))  # surprise
`,
  },
  { id: "f4", name: "scratch.ts", language: "typescript", code: "" },
];

const MODES: {
  id: Mode;
  label: string;
  icon: typeof PenLine;
  placeholder: string;
  chips: string[];
}[] = [
    {
      id: "write",
      label: "Write",
      icon: PenLine,
      placeholder: "Describe what you want to build…",
      chips: [
        "A debounce helper with TypeScript types",
        "Fetch JSON with retries and a timeout",
        "A function that groups an array by key",
      ],
    },
    {
      id: "explain",
      label: "Read",
      icon: BookOpen,
      placeholder: "Optional — ask something specific about this file…",
      chips: ["Explain this file", "What is the time complexity?", "Walk me through it line by line"],
    },
    {
      id: "diagnose",
      label: "Debug",
      icon: Bug,
      placeholder: "Optional — describe the symptom you're seeing…",
      chips: ["Find the bugs", "Check edge cases", "Why does this behave unexpectedly?"],
    },
  ];

class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackValue: string; onChange: (v: string) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error("Monaco Editor error caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col bg-[#FAF8F2] p-4 text-[#1B1915]">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFCF] text-xs font-mono">
            <span className="text-[#8A8272]">Editor running in lightweight fallback mode</span>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="text-xs underline hover:text-black cursor-pointer font-semibold"
            >
              Retry Full Monaco
            </button>
          </div>
          <textarea
            value={this.props.fallbackValue}
            onChange={(e) => this.props.onChange(e.target.value)}
            className="flex-1 w-full resize-none font-mono text-sm bg-transparent outline-none pt-3 leading-relaxed"
            spellCheck={false}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

const defineTheme: BeforeMount = (monaco) => {
  try {
    monaco.editor.defineTheme("paper", {
      base: "vs",
      inherit: false,
      rules: [
        { token: "", foreground: "1B1915" },
        { token: "comment", foreground: "8A8272", fontStyle: "italic" },
        { token: "keyword", foreground: "1B1915", fontStyle: "bold" },
        { token: "string", foreground: "A3361A" },
        { token: "number", foreground: "A3361A" },
        { token: "type", foreground: "1B1915", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#FAF8F2",
        "editor.foreground": "#1B1915",
        "editorLineNumber.foreground": "#B9B09C",
        "editorLineNumber.activeForeground": "#1B1915",
        "editor.lineHighlightBackground": "#F1ECDF",
        "editor.lineHighlightBorder": "#F1ECDF",
        "editor.selectionBackground": "#D8D0BF",
        "editorCursor.foreground": "#CF3F1B",
        "editorIndentGuide.background1": "#E6DFCF",
        "editorWidget.background": "#FAF8F2",
        "editorWidget.border": "#1B1915",
        "scrollbarSlider.background": "#B9B09C55",
      },
    });
  } catch { }
};

function formatArg(arg: any): string {
  if (arg === null) return "null";
  if (arg === undefined) return "undefined";
  if (typeof arg === "object") {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

export function Lab() {
  const [files, setFiles] = useState<FileEntry[]>(INITIAL_FILES);
  const [openIds, setOpenIds] = useState<string[]>(["f1", "f2", "f3"]);
  const [activeId, setActiveId] = useState("f1");
  const [folderTitle, setFolderTitle] = useState<string | null>(null);
  const [naming, setNaming] = useState<string | null>(null);

  const [replyLanguage, setReplyLanguage] = useState("English");
  const [mode, setMode] = useState<Mode>("explain");

  type FileAssistantData = {
    output: string;
    error: string;
    usedModel: string;
    instruction: string;
    targetFileName: string;
  };

  const [fileAssistantMap, setFileAssistantMap] = useState<Record<string, FileAssistantData>>({});
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });

  // Terminal & Execution State
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [executing, setExecuting] = useState(false);
  const [execDuration, setExecDuration] = useState<number | null>(null);
  const [stdinValue, setStdinValue] = useState("");

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const active = files.find((f) => f.id === activeId) ?? files[0];
  const modeMeta = MODES.find((m) => m.id === mode)!;

  const currentAssistantData: FileAssistantData = fileAssistantMap[activeId] ?? {
    output: "",
    error: "",
    usedModel: "",
    instruction: "",
    targetFileName: active?.name ?? "",
  };

  const setInstruction = (val: string) => {
    setFileAssistantMap((prev) => ({
      ...prev,
      [activeId]: {
        ...(prev[activeId] ?? {
          output: "",
          error: "",
          usedModel: "",
          targetFileName: active.name,
        }),
        instruction: val,
      },
    }));
  };

  const updateCode = (id: string, code: string) =>
    setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, code } : f)));

  // AI Translate / Explain / Diagnose Run
  const runAI = useCallback(async () => {
    if (loading || !active) return;
    const currentCode = editorRef.current?.getValue() ?? active.code;
    const currentInstruction = (fileAssistantMap[active.id]?.instruction ?? "").trim();
    if (!currentInstruction && !currentCode.trim()) return;

    // Detect if user is asking to write/generate code (e.g. "write me a code in C")
    const isWriteIntent = /^\s*(write|create|generate|implement|build|code|give me|show me)\b/i.test(currentInstruction);
    const effectiveMode = isWriteIntent || (!currentCode.trim() && currentInstruction) ? "write" : mode;
    if (effectiveMode !== mode) {
      setMode(effectiveMode);
    }

    setLoading(true);
    setFileAssistantMap((prev) => ({
      ...prev,
      [active.id]: {
        ...(prev[active.id] ?? { instruction: currentInstruction }),
        output: "",
        error: "",
        usedModel: "",
        targetFileName: active.name,
      },
    }));

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: effectiveMode,
          instruction: currentInstruction,
          codeSnippet: currentCode,
          fileName: active.name,
          targetLanguage: replyLanguage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFileAssistantMap((prev) => ({
          ...prev,
          [active.id]: {
            output: data.result ?? "",
            error: "",
            usedModel: data.activeModel ?? "",
            instruction: currentInstruction,
            targetFileName: active.name,
          },
        }));
      } else {
        setFileAssistantMap((prev) => ({
          ...prev,
          [active.id]: {
            ...(prev[active.id] ?? { instruction: currentInstruction, usedModel: "" }),
            output: "",
            error: data.error || "Something went wrong.",
            targetFileName: active.name,
          },
        }));
      }
    } catch (err) {
      setFileAssistantMap((prev) => ({
        ...prev,
        [active.id]: {
          ...(prev[active.id] ?? { instruction: currentInstruction, usedModel: "" }),
          output: "",
          error: err instanceof Error ? err.message : "Request failed.",
          targetFileName: active.name,
        },
      }));
    } finally {
      setLoading(false);
    }
  }, [loading, active, mode, fileAssistantMap, replyLanguage]);

  // Code Execution Runner
  const executeCode = useCallback(async () => {
    if (!active) return;
    const codeToRun = editorRef.current?.getValue() ?? active.code;
    setExecuting(true);
    setTerminalOpen(true);

    const now = () => new Date().toLocaleTimeString();
    const newLogs: TerminalLog[] = [
      {
        id: `sys-${Date.now()}`,
        type: "system",
        text: `Executing ${active.name} (${active.language})...`,
        time: now(),
      },
    ];

    const startTime = performance.now();

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToRun,
          language: active.language,
          fileName: active.name,
          stdin: stdinValue,
        }),
      });
      const data = await res.json();
      const duration = Math.round(performance.now() - startTime);
      setExecDuration(duration);

      if (data.stage === "compilation") {
        newLogs.push({
          id: `err-${Date.now()}`,
          type: "error",
          text: `[Compilation Error]:\n${data.error}`,
          time: now(),
        });
        newLogs.push({
          id: `exit-${Date.now()}`,
          type: "system",
          text: `[Compilation failed with code ${data.exitCode}] in ${duration}ms`,
          time: now(),
        });
      } else if (data.success) {
        if (data.stdout) {
          newLogs.push({
            id: `out-${Date.now()}`,
            type: "log",
            text: data.stdout.trimEnd(),
            time: now(),
          });
        }
        if (data.stderr) {
          newLogs.push({
            id: `warn-${Date.now()}`,
            type: "warn",
            text: data.stderr.trimEnd(),
            time: now(),
          });
        }
        if (data.simulated) {
          newLogs.push({
            id: `sim-${Date.now()}`,
            type: "info",
            text: `[AI Runtime Execution Simulation]`,
            time: now(),
          });
        }
        newLogs.push({
          id: `exit-${Date.now()}`,
          type: "system",
          text: `[Process exited 0] in ${duration}ms`,
          time: now(),
        });
      } else {
        if (data.stdout) {
          newLogs.push({
            id: `out-${Date.now()}`,
            type: "log",
            text: data.stdout.trimEnd(),
            time: now(),
          });
        }
        if (data.stderr || data.error) {
          newLogs.push({
            id: `err-${Date.now()}`,
            type: "error",
            text: (data.stderr || data.error).trimEnd(),
            time: now(),
          });
        }
        newLogs.push({
          id: `exit-${Date.now()}`,
          type: "system",
          text: `[Process exited with code ${data.exitCode ?? 1}] in ${duration}ms`,
          time: now(),
        });
      }
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      setExecDuration(duration);
      newLogs.push({
        id: `err-${Date.now()}`,
        type: "error",
        text: `Execution failed: ${err.message || String(err)}`,
        time: now(),
      });
      newLogs.push({
        id: `exit-${Date.now()}`,
        type: "system",
        text: `[Process failed in ${duration}ms]`,
        time: now(),
      });
    }

    setTerminalLogs((prev) => [...prev, ...newLogs]);
    setExecuting(false);
  }, [active, stdinValue]);

  // Keep the latest `run` reachable from Monaco's keybinding and the window.
  const runRef = useRef(runAI);
  useEffect(() => {
    runRef.current = runAI;
  }, [runAI]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) =>
      setCursor({ line: e.position.lineNumber, col: e.position.column })
    );
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
      runRef.current()
    );
  };

  const insertAtCursor = (code: string) => {
    const ed = editorRef.current;
    if (!ed) return;
    const sel = ed.getSelection();
    if (sel) {
      ed.executeEdits("polyglot", [
        { range: sel, text: code, forceMoveMarkers: true },
      ]);
      ed.focus();
    }
  };

  const replaceFile = (code: string) => updateCode(active.id, code + "\n");

  const openFile = (id: string) => {
    setOpenIds((o) => (o.includes(id) ? o : [...o, id]));
    setActiveId(id);
  };

  const closeTab = (id: string) => {
    const next = openIds.filter((x) => x !== id);
    setOpenIds(next);
    if (id === activeId) setActiveId(next[next.length - 1] ?? files.find((f) => f.id !== id)?.id ?? id);
  };

  const deleteFile = (id: string) => {
    if (files.length <= 1) return;
    const remaining = files.filter((f) => f.id !== id);
    setFiles(remaining);
    const nextOpen = openIds.filter((x) => x !== id);
    setOpenIds(nextOpen);
    if (id === activeId) setActiveId(nextOpen[nextOpen.length - 1] ?? remaining[0].id);
  };

  const createFile = (raw: string) => {
    const name = raw.trim();
    setNaming(null);
    if (!name) return;
    const id = `f${Date.now()}`;
    setFiles((fs) => [...fs, { id, name, language: languageFor(name), code: "" }]);
    setOpenIds((o) => [...o, id]);
    setActiveId(id);
  };

  // Open Local Files from user system
  const openLocalFiles = async () => {
    if (typeof window !== "undefined" && "showOpenFilePicker" in window) {
      try {
        const handles = await (window as any).showOpenFilePicker({ multiple: true });
        const newEntries: FileEntry[] = [];
        for (const handle of handles) {
          const file = await handle.getFile();
          const text = await file.text();
          newEntries.push({
            id: `local-${Date.now()}-${Math.random()}`,
            name: file.name,
            language: languageFor(file.name),
            code: text,
          });
        }
        if (newEntries.length > 0) {
          setFiles((prev) => [...prev, ...newEntries]);
          setOpenIds((prev) => [...prev, ...newEntries.map((e) => e.id)]);
          setActiveId(newEntries[0].id);
        }
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }
    // Fallback: file input
    fileInputRef.current?.click();
  };

  const handleFilesPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const newEntries: FileEntry[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const text = await file.text();
      newEntries.push({
        id: `local-${Date.now()}-${i}`,
        name: file.name,
        language: languageFor(file.name),
        code: text,
      });
    }
    if (newEntries.length > 0) {
      setFiles((prev) => [...prev, ...newEntries]);
      setOpenIds((prev) => [...prev, ...newEntries.map((e) => e.id)]);
      setActiveId(newEntries[0].id);
    }
    e.target.value = "";
  };

  // Open Local Folder from user system
  const openLocalFolder = async () => {
    if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        setFolderTitle(dirHandle.name);
        const newEntries: FileEntry[] = [];

        async function readDir(handle: any) {
          for await (const entry of handle.values()) {
            if (entry.kind === "file") {
              if (entry.name.startsWith(".") || entry.name.endsWith(".lock")) continue;
              const file = await entry.getFile();
              if (file.size > 2 * 1024 * 1024) continue; // skip >2MB files
              const text = await file.text();
              newEntries.push({
                id: `dir-${Date.now()}-${Math.random()}`,
                name: entry.name,
                language: languageFor(entry.name),
                code: text,
              });
            } else if (entry.kind === "directory") {
              if (["node_modules", ".git", ".next", "dist", "build"].includes(entry.name)) continue;
              await readDir(entry);
            }
          }
        }

        await readDir(dirHandle);

        if (newEntries.length > 0) {
          setFiles(newEntries);
          setOpenIds(newEntries.slice(0, 5).map((e) => e.id));
          setActiveId(newEntries[0].id);
        }
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }
    // Fallback: folder input
    folderInputRef.current?.click();
  };

  const handleFolderPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const newEntries: FileEntry[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 2 * 1024 * 1024) continue;
      if (file.webkitRelativePath?.includes("node_modules/") || file.webkitRelativePath?.includes(".git/")) continue;
      const text = await file.text();
      newEntries.push({
        id: `folder-${Date.now()}-${i}`,
        name: file.name,
        language: languageFor(file.name),
        code: text,
      });
    }
    if (newEntries.length > 0) {
      setFiles(newEntries);
      setOpenIds(newEntries.slice(0, 5).map((e) => e.id));
      setActiveId(newEntries[0].id);
      setFolderTitle("Local Folder");
    }
    e.target.value = "";
  };

  const hasInstruction = !!currentAssistantData.instruction.trim();
  const hasCode = !!(editorRef.current?.getValue() ?? active?.code).trim();
  const canRun = !loading && (hasInstruction || hasCode);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground selection:bg-foreground selection:text-background">
      {/* Hidden File System Inputs */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFilesPicked}
        className="hidden"
      />
      <input
        type="file"
        multiple
        ref={folderInputRef}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        onChange={handleFolderPicked}
        className="hidden"
      />

      {/* Main Title Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-foreground px-4 bg-card select-none">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-1.5 font-heading text-lg font-semibold tracking-tight hover:opacity-80"
            title="Return to Home"
          >
            <span className="text-muted-foreground group-hover:text-foreground text-xs font-mono transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
            <span>
              PolyGlot <span className="font-normal italic">Code-Lab</span>
            </span>
          </Link>
          <span className="hidden text-xs text-muted-foreground border-l border-border pl-4 md:inline font-mono">
            Multi-language AI Engine
          </span>
        </div>

        {/* Global Controls & Action Buttons */}
        <div className="flex items-center gap-3 text-sm">
          {/* RUN CODE BUTTON */}
          <Button
            size="sm"
            onClick={executeCode}
            disabled={executing}
            className="h-7 gap-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
          >
            <Play className="size-3 fill-current" />
            {executing ? "Running..." : "Run Code"}
          </Button>

          {/* TERMINAL DRAWER TOGGLE */}
          <button
            type="button"
            onClick={() => setTerminalOpen((v) => !v)}
            className={cn(
              "flex h-7 items-center gap-1.5 border border-border px-2.5 font-mono text-xs cursor-pointer",
              terminalOpen ? "bg-foreground text-background" : "hover:bg-secondary text-foreground"
            )}
            title="Toggle Output / Terminal panel"
          >
            <Terminal className="size-3" />
            <span>Terminal</span>
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          <span className="hidden text-muted-foreground sm:inline text-xs font-mono">Reply in:</span>
          <Select value={replyLanguage} onValueChange={setReplyLanguage}>
            <SelectTrigger
              size="sm"
              aria-label="Reply language"
              className="h-7 w-28 border-b-foreground text-xs font-medium"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main Multi-Column Workbench */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[48px_220px_minmax(0,1fr)_minmax(380px,34%)]">
        {/* Activity Bar */}
        <nav
          aria-label="Activity"
          className="hidden flex-col items-center justify-between border-r border-foreground bg-secondary py-3 md:flex"
        >
          <div className="flex flex-col items-center gap-2">
            <button
              className="relative flex size-9 items-center justify-center text-foreground hover:bg-card"
              title="Explorer"
            >
              <span className="absolute inset-y-1 left-[-1px] w-0.5 bg-vermilion" />
              <Files className="size-5" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setTerminalOpen((v) => !v)}
              className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card"
              title="Toggle Terminal"
            >
              <Terminal className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <span className="flex size-9 items-center justify-center text-muted-foreground">
            <Sparkles className="size-4" strokeWidth={1.5} />
          </span>
        </nav>

        {/* Explorer Sidebar */}
        <aside
          aria-label="Explorer"
          className="hidden min-h-0 flex-col border-r border-foreground bg-card md:flex select-none"
        >
          {/* Explorer Header with Actions */}
          <div className="flex h-9 items-center justify-between border-b border-border px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <span className="truncate">{folderTitle ? `FOLDER: ${folderTitle}` : "EXPLORER"}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Open File from disk"
                title="Open File from disk"
                onClick={openLocalFiles}
                className="p-1 hover:bg-secondary hover:text-foreground cursor-pointer"
              >
                <FileUp className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Open Folder from disk"
                title="Open Folder from disk"
                onClick={openLocalFolder}
                className="p-1 hover:bg-secondary hover:text-foreground cursor-pointer"
              >
                <FolderOpen className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="New file"
                title="New file"
                onClick={() => setNaming("")}
                className="p-1 hover:bg-secondary hover:text-foreground cursor-pointer"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Explorer Quick Open Buttons Banner */}
          <div className="border-b border-border bg-secondary/30 p-2 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={openLocalFiles}
              className="flex items-center gap-2 border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground cursor-pointer"
            >
              <FileUp className="size-3" />
              <span>Open Local File...</span>
            </button>
            <button
              type="button"
              onClick={openLocalFolder}
              className="flex items-center gap-2 border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground cursor-pointer"
            >
              <FolderOpen className="size-3" />
              <span>Open Local Folder...</span>
            </button>
          </div>

          {/* Files List */}
          <ul className="min-h-0 flex-1 overflow-y-auto pb-2 text-[13px]">
            {files.map((f) => (
              <li key={f.id} className="group relative">
                <button
                  type="button"
                  onClick={() => openFile(f.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono hover:bg-secondary cursor-pointer",
                    f.id === activeId && "bg-secondary font-medium"
                  )}
                >
                  <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{f.name}</span>
                </button>
                {files.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Delete ${f.name}`}
                    onClick={() => deleteFile(f.id)}
                    className="absolute top-1/2 right-2 hidden -translate-y-1/2 p-1 text-muted-foreground hover:text-vermilion group-hover:block cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
            {naming !== null && (
              <li className="px-3 py-1">
                <input
                  autoFocus
                  value={naming}
                  onChange={(e) => setNaming(e.target.value)}
                  onBlur={() => createFile(naming)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createFile(naming);
                    if (e.key === "Escape") setNaming(null);
                  }}
                  placeholder="name.ext"
                  className="w-full border border-foreground bg-background px-2 py-1 font-mono text-[13px] outline-none"
                />
              </li>
            )}
          </ul>
        </aside>

        {/* Center Editor Column with Bottom Terminal Drawer */}
        <section className="flex min-h-0 min-w-0 flex-col bg-background" aria-label="Editor">
          {/* Top File Tabs Bar */}
          <div
            role="tablist"
            className="flex h-9 shrink-0 items-center justify-between overflow-x-auto border-b border-foreground bg-secondary"
          >
            <div className="flex h-full overflow-x-auto">
              {openIds.map((id) => {
                const f = files.find((x) => x.id === id);
                if (!f) return null;
                const isActive = id === activeId;
                return (
                  <div
                    key={id}
                    role="tab"
                    aria-selected={isActive}
                    className={cn(
                      "group relative flex shrink-0 items-center gap-2 border-r border-foreground/20 pr-1 pl-3 font-mono text-[13px]",
                      isActive ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && <span className="absolute inset-x-0 top-0 h-0.5 bg-vermilion" />}
                    <button type="button" onClick={() => setActiveId(id)} className="py-2 cursor-pointer">
                      {f.name}
                    </button>
                    <button
                      type="button"
                      aria-label={`Close ${f.name}`}
                      onClick={() => closeTab(id)}
                      className="p-1 opacity-50 hover:bg-secondary hover:opacity-100 cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* In-Editor Quick Run Button */}
            <div className="flex items-center pr-2">
              <button
                type="button"
                onClick={executeCode}
                disabled={executing}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer"
                title="Execute current file"
              >
                <Play className="size-2.5 fill-current" />
                <span>{executing ? "Running..." : "Run"}</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Canvas */}
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
              <EditorErrorBoundary fallbackValue={active.code} onChange={(v) => updateCode(active.id, v)}>
                <Editor
                  height="100%"
                  language={active.language}
                  theme="paper"
                  value={active.code}
                  beforeMount={defineTheme}
                  onMount={onMount}
                  onChange={(v) => updateCode(active.id, v ?? "")}
                  loading={
                    <div className="flex h-full w-full items-center justify-center bg-[#FAF8F2] text-[#8A8272] font-mono text-xs">
                      <span className="animate-pulse">initializing paper-ink editor…</span>
                    </div>
                  }
                  options={{
                    minimap: { enabled: true, renderCharacters: false, scale: 1 },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
                    fontLigatures: true,
                    lineHeight: 24,
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    roundedSelection: false,
                    automaticLayout: true,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    bracketPairColorization: { enabled: false },
                    renderLineHighlight: "line",
                    guides: { indentation: true },
                    scrollbar: { verticalScrollbarSize: 8 },
                  }}
                />
              </EditorErrorBoundary>
            </div>
          </div>

          {/* Collapsible Bottom Terminal / Console Drawer */}
          {terminalOpen && (
            <div className="flex h-56 shrink-0 flex-col border-t-2 border-foreground bg-card select-none">
              <div className="flex h-8 items-center justify-between border-b border-border bg-secondary px-3 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="size-3.5" />
                    Terminal Output
                  </span>
                  {execDuration !== null && (
                    <span className="text-[11px] text-muted-foreground">
                      Finished in {execDuration}ms
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 border-r border-border pr-2 mr-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">stdin:</span>
                    <input
                      type="text"
                      value={stdinValue}
                      onChange={(e) => setStdinValue(e.target.value)}
                      placeholder="Input for scanf / input()..."
                      className="h-5 w-44 bg-background border border-border px-1.5 font-mono text-[11px] outline-none focus:border-foreground text-foreground placeholder:text-muted-foreground/60"
                      title="Standard input passed to program when executed"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={executeCode}
                    disabled={executing}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Re-run code"
                  >
                    <RotateCw className={cn("size-3", executing && "animate-spin")} />
                    <span>Rerun</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTerminalLogs([])}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Clear console"
                  >
                    <Trash2 className="size-3" />
                    <span>Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTerminalOpen(false)}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Close terminal"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Terminal Logs Stream */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[12.5px] leading-relaxed bg-[#1b1915] text-[#f3efe6]">
                {terminalLogs.length === 0 ? (
                  <p className="text-neutral-500 italic">
                    Terminal ready. Click &quot;Run Code&quot; above to execute {active.name}.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {terminalLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2">
                        <span className="text-[10px] text-neutral-500 select-none pt-0.5">{log.time}</span>
                        {log.type === "system" && (
                          <span className="text-cyan-400 font-semibold">{log.text}</span>
                        )}
                        {log.type === "log" && (
                          <span className="text-neutral-200">{log.text}</span>
                        )}
                        {log.type === "info" && (
                          <span className="text-emerald-400">{log.text}</span>
                        )}
                        {log.type === "warn" && (
                          <span className="text-amber-400">{log.text}</span>
                        )}
                        {log.type === "error" && (
                          <span className="text-rose-400 font-semibold">{log.text}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Assistant Column */}
        <aside
          aria-label="Assistant"
          className="flex min-h-0 min-w-0 flex-col border-t border-foreground bg-card md:border-t-0 md:border-l select-none"
        >
          {/* Mode Selector Tabs */}
          <div className="shrink-0 border-b border-foreground">
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="h-11 w-full gap-0 bg-transparent p-0">
                {MODES.map((m, i) => (
                  <TabsTrigger
                    key={m.id}
                    value={m.id}
                    className={cn(
                      "h-full gap-2 border-0 text-[13px] tracking-normal normal-case data-active:bg-foreground data-active:text-background dark:data-active:bg-foreground cursor-pointer",
                      i > 0 && "border-l border-foreground/20"
                    )}
                  >
                    <m.icon className="size-3.5" /> {m.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Active Target File Banner */}
            <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-4 py-2 text-xs">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-muted-foreground uppercase tracking-wider">Target:</span>
                <span className="font-semibold text-foreground border border-border bg-background px-2 py-0.5">
                  {active.name}
                </span>
                <span className="text-muted-foreground/60">{active.language}</span>
              </div>
              {currentAssistantData.output && (
                <button
                  type="button"
                  onClick={() => {
                    setFileAssistantMap((prev) => {
                      const next = { ...prev };
                      delete next[activeId];
                      return next;
                    });
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline decoration-dotted cursor-pointer"
                >
                  Clear output
                </button>
              )}
            </div>
          </div>

          {/* AI Result Content Stream */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 select-text" aria-live="polite">
            {loading ? (
              <div className="space-y-3" aria-label="Loading result">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="mt-6 h-24 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : currentAssistantData.error ? (
              <div className="border border-vermilion p-4 text-sm leading-6">
                <p className="font-semibold text-vermilion">That didn&apos;t work.</p>
                <p className="mt-1 text-foreground/80">{currentAssistantData.error}</p>
              </div>
            ) : currentAssistantData.output ? (
              <>
                <OutputView
                  text={currentAssistantData.output}
                  onInsert={insertAtCursor}
                  onReplace={replaceFile}
                />
                {currentAssistantData.usedModel && (
                  <p className="mt-8 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
                    answered by {currentAssistantData.usedModel}
                  </p>
                )}
              </>
            ) : (
              <div className="anim-fade">
                <p className="font-heading text-2xl italic text-muted-foreground">
                  {mode === "write" ? "What shall we build?" : mode === "explain" ? "What should I read?" : "Let's hunt some bugs."}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Working on <span className="font-mono text-foreground font-semibold">{active.name}</span>
                  {replyLanguage !== "English" && <> · replying in {replyLanguage}</>}.
                </p>
                <div className="mt-5 flex flex-col items-start gap-2">
                  {modeMeta.chips.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setInstruction(c)}
                      className="border border-border bg-background px-3 py-1.5 text-left text-[13px] hover:border-foreground cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assistant Prompt Input Box */}
          <div className="shrink-0 border-t border-foreground bg-background p-3">
            <textarea
              value={currentAssistantData.instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={modeMeta.placeholder}
              rows={3}
              aria-label="Instruction"
              className="w-full resize-none border border-border bg-card p-3 text-[14px] leading-6 outline-none placeholder:text-muted-foreground focus:border-foreground font-sans"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">
                context: {active.name}
              </span>
              <Button onClick={runAI} disabled={!canRun} size="sm" className="gap-2 text-sm tracking-normal normal-case cursor-pointer">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" /> Working…
                  </>
                ) : (
                  <>
                    {mode === "write" ||
                      /^\s*(write|create|generate|implement|build|code|give me|show me)\b/i.test(
                        currentAssistantData.instruction
                      ) ||
                      (!hasCode && hasInstruction)
                      ? "Write code"
                      : mode === "explain"
                        ? "Explain"
                        : "Find bugs"}
                    <CornerDownLeft className="size-3!" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* VS Code Bottom Status Bar */}
      <footer className="flex h-6 shrink-0 items-center justify-between bg-foreground px-3 font-mono text-[11px] text-background select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={cn("size-1.5", loading || executing ? "anim-caret bg-vermilion" : "bg-background")} />
            {loading ? "ai thinking" : executing ? "running code" : "ready"}
          </span>
          {currentAssistantData.usedModel && (
            <span className="hidden opacity-70 sm:inline">{currentAssistantData.usedModel}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setTerminalOpen((v) => !v)}
            className="hover:underline flex items-center gap-1"
          >
            <Terminal className="size-2.5" />
            <span>{terminalOpen ? "Hide Terminal" : "Show Terminal"}</span>
          </button>
          <span>
            Ln {cursor.line}, Col {cursor.col}
          </span>
          <span className="hidden sm:inline">{active.language}</span>
          <span className="hidden sm:inline">reply: {replyLanguage}</span>
          <span className="hidden opacity-70 md:inline">Ctrl+Enter to ask AI</span>
        </div>
      </footer>
    </div>
  );
}
