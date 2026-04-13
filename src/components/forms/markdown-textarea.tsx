"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Bold, Italic, Code, Link as LinkIcon, Quote, List, ListOrdered, Heading1, Heading2 } from "lucide-react";

type MarkdownTextareaProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  error?: string | null;
};

type ToolbarAction = {
  icon: React.ElementType;
  title: string;
  run: (
    value: string,
    selectionStart: number,
    selectionEnd: number,
  ) => { nextValue: string; selectionStart: number; selectionEnd: number };
};

function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string,
  placeholder: string,
) {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const insertedText = `${prefix}${selectedText || placeholder}${suffix}`;
  const nextValue =
    value.slice(0, selectionStart) +
    insertedText +
    value.slice(selectionEnd);
  const highlightStart = selectionStart + prefix.length;
  const highlightEnd =
    highlightStart + (selectedText || placeholder).length;

  return {
    nextValue,
    selectionStart: highlightStart,
    selectionEnd: highlightEnd,
  };
}

function prependLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefixBuilder: (index: number) => string,
  placeholder: string,
) {
  const selectedText = value.slice(selectionStart, selectionEnd) || placeholder;
  const lines = selectedText.split("\n");
  const nextBlock = lines
    .map((line, index) => `${prefixBuilder(index)}${line}`)
    .join("\n");
  const nextValue =
    value.slice(0, selectionStart) + nextBlock + value.slice(selectionEnd);

  return {
    nextValue,
    selectionStart,
    selectionEnd: selectionStart + nextBlock.length,
  };
}

const toolbarActions: ToolbarAction[] = [
  {
    icon: Bold,
    title: "Bold",
    run: (value, selectionStart, selectionEnd) =>
      wrapSelection(value, selectionStart, selectionEnd, "**", "**", "bold text"),
  },
  {
    icon: Italic,
    title: "Italic",
    run: (value, selectionStart, selectionEnd) =>
      wrapSelection(value, selectionStart, selectionEnd, "_", "_", "italic text"),
  },
  {
    icon: Code,
    title: "Inline code",
    run: (value, selectionStart, selectionEnd) =>
      wrapSelection(value, selectionStart, selectionEnd, "`", "`", "code"),
  },
  {
    icon: LinkIcon,
    title: "Link",
    run: (value, selectionStart, selectionEnd) => {
      const selectedText = value.slice(selectionStart, selectionEnd) || "link text";
      const insertedText = `[${selectedText}](https://example.com)`;
      const nextValue =
        value.slice(0, selectionStart) +
        insertedText +
        value.slice(selectionEnd);
      const urlStart = selectionStart + selectedText.length + 3;
      const urlEnd = urlStart + "https://example.com".length;

      return {
        nextValue,
        selectionStart: urlStart,
        selectionEnd: urlEnd,
      };
    },
  },
  {
    icon: Quote,
    title: "Quote",
    run: (value, selectionStart, selectionEnd) =>
      prependLines(value, selectionStart, selectionEnd, () => "> ", "Quoted text"),
  },
  {
    icon: List,
    title: "Bullet list",
    run: (value, selectionStart, selectionEnd) =>
      prependLines(value, selectionStart, selectionEnd, () => "- ", "List item"),
  },
  {
    icon: ListOrdered,
    title: "Numbered list",
    run: (value, selectionStart, selectionEnd) =>
      prependLines(
        value,
        selectionStart,
        selectionEnd,
        (index) => `${index + 1}. `,
        "List item",
      ),
  },
  {
    icon: Heading1,
    title: "H1",
    run: (value, selectionStart, selectionEnd) =>
      prependLines(value, selectionStart, selectionEnd, () => "# ", "Heading"),
  },
  {
    icon: Heading2,
    title: "H2",
    run: (value, selectionStart, selectionEnd) =>
      prependLines(value, selectionStart, selectionEnd, () => "## ", "Heading"),
  },
];

export function MarkdownTextarea({
  id,
  value,
  onChange,
  rows = 8,
  placeholder,
  maxLength = 5000,
  disabled = false,
  error,
}: MarkdownTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function applyAction(action: ToolbarAction) {
    const textarea = textareaRef.current;

    if (!textarea || disabled) {
      return;
    }

    const next = action.run(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
    );

    onChange(next.nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-all duration-200",
        error
          ? "border-destructive ring-4 ring-destructive/10"
          : "border-border bg-background focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
        {toolbarActions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => applyAction(action)}
            disabled={disabled}
            title={action.title}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-30"
          >
            <action.icon size={16} />
          </button>
        ))}
        <span className="ml-auto px-2 text-[10px] font-black  tracking-widest text-muted-foreground/40">
          {value.trim().length}/{maxLength}
        </span>
      </div>
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 outline-none min-h-[120px]"
      />
    </div>
  );
}
