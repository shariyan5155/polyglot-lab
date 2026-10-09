import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
];

type Mode = "write" | "explain" | "diagnose";

/**
 * The reply language is enforced in the *system instruction* (not buried in the
 * user prompt) so it holds for every mode, including bug reports where the
 * model otherwise drifts back to English around the corrected code.
 */
function buildSystemInstruction(language: string, mode: Mode) {
  const isEnglish = language.toLowerCase() === "english";

  const languageRule = isEnglish
    ? "Reply in clear, natural English."
    : `LANGUAGE RULE (strict): Write the ENTIRE reply in ${language}, using its native script. ` +
    `That includes every heading, label, sentence, bullet point and closing remark — ` +
    `do not write any English prose and do not add English translations. ` +
    `Only source code, identifiers, keywords and library names stay as they are. ` +
    `Comments inside any code you write must also be in ${language}.`;

  const task: Record<Mode, string> = {
    write:
      "Act as an expert polyglot code writer. Turn the user's request into clean, idiomatic, working code in whatever programming language they requested (e.g. C, C++, Python, Rust, Go, Java, TypeScript, JavaScript, Assembly, SQL, HTML/CSS, etc.). " +
      "If the user specifies a language like C, write valid C code with necessary standard libraries (e.g. #include <stdio.h>, #include <stdlib.h>), proper memory management, and clean syntax. " +
      "Output the complete code in ONE fenced code block tagged with the exact language identifier (e.g. ```c or ```cpp or ```python), " +
      "followed by a concise developer-friendly explanation of how the code works and how to compile/run it.",
    explain:
      "Act as a code reader. Explain what the code does, step by step, in plain words: " +
      "the overall intent first, then the key logic, then any edge cases or complexity worth knowing. " +
      "Use short paragraphs or bullets. If the user asks to write code instead, fulfill the code request in the requested language.",
    diagnose:
      "Act as a debugger. Find syntax, semantic and logic bugs. For each bug give: " +
      "where it is, why it is wrong, and the fix. If no bugs exist, say so plainly. " +
      "Finish with the complete corrected code in ONE fenced code block tagged with the correct language.",
  };

  return [
    "You are PolyGlot, the AI pair programmer inside PolyGlot Code-Lab — a code writer, reader and debugger in one that supports ALL programming languages.",
    task[mode],
    "Format the reply in Markdown. Be concise, concrete and actionable; no filler.",
    languageRule,
  ].join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in .env.local. Please restart the dev server (npm run dev) after updating .env.local." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json();
    const codeSnippet: string = body.codeSnippet ?? "";
    const instruction: string = (body.instruction ?? "").trim();
    const targetLanguage: string = body.targetLanguage || "English";
    const fileName: string = body.fileName || "snippet";

    // Smart mode resolution: if the user explicitly asks to write or create code, or if the current buffer is empty and an instruction is given, seamlessly fulfill it as "write"
    const isWriteIntent = /^\s*(write|create|generate|implement|build|code|give me|show me)\b/i.test(instruction);
    const mode: Mode = isWriteIntent || (!codeSnippet.trim() && instruction)
      ? "write"
      : (["write", "explain", "diagnose"].includes(body.mode) ? body.mode : "explain");

    if (mode === "write" && !instruction && !codeSnippet.trim()) {
      return NextResponse.json(
        { error: "Please provide a prompt describing what code you want written." },
        { status: 400 }
      );
    }
    if (mode !== "write" && !codeSnippet.trim() && !instruction) {
      return NextResponse.json(
        { error: "No code snippet provided. Enter or paste code, or type a request in the prompt box." },
        { status: 400 }
      );
    }

    const parts: string[] = [];
    parts.push(`Active File: "${fileName}"`);
    if (instruction) {
      parts.push(`User Request / Instruction: ${instruction}`);
    }
    if (codeSnippet.trim()) {
      parts.push(
        `Source Code of "${fileName}":\n\`\`\`\n${codeSnippet}\n\`\`\``
      );
    }
    const contents = parts.join("\n\n");
    const systemInstruction = buildSystemInstruction(targetLanguage, mode);

    let lastError: any = null;

    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction },
        });

        return NextResponse.json({
          result: response.text,
          activeModel: model,
        });
      } catch (err: any) {
        console.warn(`Model ${model} busy/unavailable, trying fallback...`);
        lastError = err;
      }
    }

    throw lastError || new Error("All model tiers are currently busy.");
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process translation" },
      { status: 500 }
    );
  }
}