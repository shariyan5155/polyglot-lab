import { NextRequest, NextResponse } from "next/server";
import { execFile, spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import { GoogleGenAI } from "@google/genai";

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 6000;

function runProcess(
  command: string,
  args: string[],
  cwd: string,
  stdinInput: string = "",
  timeoutMs: number = TIMEOUT_MS
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let killed = false;

    const child = spawn(command, args, { cwd });

    const timer = setTimeout(() => {
      killed = true;
      try {
        child.kill();
      } catch {}
    }, timeoutMs);

    // Provide stdin or close it immediately so scanf/input() receive EOF rather than hanging indefinitely
    if (child.stdin) {
      if (stdinInput) {
        child.stdin.write(stdinInput);
        if (!stdinInput.endsWith("\n")) {
          child.stdin.write("\n");
        }
      }
      child.stdin.end();
    }

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (killed) {
        const err: any = new Error("Execution timed out (infinite loop protection)");
        err.killed = true;
        err.stdout = stdout;
        err.stderr = stderr || "Execution timed out (infinite loop protection)";
        err.code = 1;
        return reject(err);
      }
      if (code !== 0 && code !== null) {
        const err: any = new Error(`Process exited with code ${code}`);
        err.code = code;
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr, exitCode: 0 });
    });
  });
}

export async function POST(req: NextRequest) {
  let tempDir = "";
  try {
    const { code, language, fileName, stdin: stdinInput = "" } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "No code provided to execute." }, { status: 400 });
    }

    const lang = (language || "").toLowerCase();
    const name = fileName || (lang === "c" ? "main.c" : lang === "python" ? "main.py" : "main.js");

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "polyglot-run-"));
    const filePath = path.join(tempDir, name);
    await fs.writeFile(filePath, code, "utf8");

    // 1. C & C++ Execution via local GCC
    if (lang === "c" || lang === "cpp" || name.endsWith(".c") || name.endsWith(".cpp")) {
      const isCpp = lang === "cpp" || name.endsWith(".cpp");
      const exeName = isCpp ? "prog_cpp.exe" : "prog_c.exe";
      const exePath = path.join(tempDir, exeName);
      const compiler = isCpp ? "g++" : "gcc";

      try {
        // Compile with GCC / G++
        await execFileAsync(compiler, ["-O2", filePath, "-o", exePath], {
          cwd: tempDir,
          timeout: TIMEOUT_MS,
        });
      } catch (compileErr: any) {
        return NextResponse.json({
          success: false,
          stage: "compilation",
          error: compileErr.stderr || compileErr.stdout || compileErr.message,
          exitCode: compileErr.code || 1,
        });
      }

      // Execute compiled binary
      try {
        const { stdout, stderr } = await runProcess(exePath, [], tempDir, stdinInput, TIMEOUT_MS);

        return NextResponse.json({
          success: true,
          stdout: stdout || "",
          stderr: stderr || "",
          exitCode: 0,
        });
      } catch (runErr: any) {
        return NextResponse.json({
          success: false,
          stage: "runtime",
          stdout: runErr.stdout || "",
          stderr: runErr.stderr || (runErr.killed ? "Execution timed out (infinite loop protection)" : runErr.message),
          exitCode: runErr.code || 1,
        });
      }
    }

    // 2. Python Execution via local Python
    if (lang === "python" || name.endsWith(".py")) {
      try {
        const { stdout, stderr } = await runProcess("python", ["-u", filePath], tempDir, stdinInput, TIMEOUT_MS);

        return NextResponse.json({
          success: true,
          stdout: stdout || "",
          stderr: stderr || "",
          exitCode: 0,
        });
      } catch (pyErr: any) {
        return NextResponse.json({
          success: false,
          stage: "runtime",
          stdout: pyErr.stdout || "",
          stderr: pyErr.stderr || (pyErr.killed ? "Execution timed out (infinite loop protection)" : pyErr.message),
          exitCode: pyErr.code || 1,
        });
      }
    }

    // 3. JavaScript / TypeScript Execution via local Node
    if (lang === "javascript" || lang === "typescript" || name.endsWith(".js") || name.endsWith(".ts")) {
      try {
        const { stdout, stderr } = await runProcess("node", [filePath], tempDir, stdinInput, TIMEOUT_MS);

        return NextResponse.json({
          success: true,
          stdout: stdout || "",
          stderr: stderr || "",
          exitCode: 0,
        });
      } catch (nodeErr: any) {
        return NextResponse.json({
          success: false,
          stage: "runtime",
          stdout: nodeErr.stdout || "",
          stderr: nodeErr.stderr || (nodeErr.killed ? "Execution timed out (infinite loop protection)" : nodeErr.message),
          exitCode: nodeErr.code || 1,
        });
      }
    }

    // 4. Fallback Execution Simulation via Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a strict, sandboxed code execution runtime for ${lang || "code"}.
Execute the following source code mentally and produce the EXACT standard console output (stdout) and standard error (stderr) that would be printed to a terminal.
Do not provide explanations, preamble, or markdown formatting. Output ONLY the raw console output:

\`\`\`
${code}
\`\`\``;

      const resp = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      return NextResponse.json({
        success: true,
        stdout: resp.text || "[No output produced]",
        stderr: "",
        exitCode: 0,
        simulated: true,
      });
    }

    return NextResponse.json({
      success: false,
      error: `Execution for ${lang} is not supported directly without local runtime.`,
    }, { status: 400 });

  } catch (error: any) {
    console.error("Execute Route Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to execute code",
    }, { status: 500 });
  } finally {
    if (tempDir) {
      fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
