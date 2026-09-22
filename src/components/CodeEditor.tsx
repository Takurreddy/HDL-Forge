"use client";

import Editor from "@monaco-editor/react";
import { useRef } from "react";
import type { OnMount } from "@monaco-editor/react";

import { useTheme } from "@/lib/theme";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
}

export default function CodeEditor({
  value,
  onChange,
  language = "systemverilog",
  height = "100%",
}: CodeEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-editor">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleEditorMount}
        theme={theme === "dark" ? "vs-dark" : "vs"}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          renderLineHighlight: "all",
          tabSize: 2,
          insertSpaces: true,
          wordWrap: "on",
          padding: { top: 16, bottom: 16 },
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
          folding: true,
          foldingStrategy: "indentation",
          showFoldingControls: "mouseover",
          glyphMargin: false,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
            useShadows: false,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
        }}
      />
    </div>
  );
}
