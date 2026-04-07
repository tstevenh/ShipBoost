"use client";

import { useRef } from "react";

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
  label: string;
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
    label: "B",
    title: "Bold",
    run: (value, selectionStart, selectionEnd) =>
      wrapSelection(value, selectionStart, selectionEnd, "**", "**", "bold text"),
  },
  {
    label: "I",
    title: "Italic",
    run: (value, selectionStart, selectionEnd) =>
      wrapSelection(value, selectionStart, selectionEnd, "_", "_", "italic text"),
  },
  {
    label: "</>",
    title: "Inline code",
    run: (value, selectionStart, selectionEnd) =>
      wrapSelection(value, selectionStart, selectionEnd, "`", "`", "code"),
  },
  {
    label: "Link",
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
    label: "Quote",
    title: "Quote",
    run: (value, selectionStart, selectionEnd) =>
      prependLines(value, selectionStart, selectionEnd, () => "> ", "Quoted text"),
  },
  {
    label: "• List",
    title: "Bullet list",
    run: (value, selectionStart, selectionEnd) =>
      prependLines(value, selectionStart, selectionEnd, () => "- ", "List item"),
  },
  {
    label: "1. List",
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
    label: "H1",
    title: "Heading 1",
    run: (value, selectionStart, selectionEnd) =>
      prependLines(value, selectionStart, selectionEnd, () => "# ", "Heading"),
  },
  {
    label: "H2",
    title: "Heading 2",
    run: (value, selectionStart, selectionEnd) =>
      prependLines(value, selectionStart, selectionEnd, () => "## ", "Heading"),
  },
  {
    label: "H3",
    title: "Heading 3",
    run: (value, selectionStart, selectionEnd) =>
      prependLines(value, selectionStart, selectionEnd, () => "### ", "Heading"),
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
      className={`overflow-hidden rounded-2xl border bg-[#fffdf8] ${
        error
          ? "border-rose-300 ring-4 ring-rose-100"
          : "border-black/10 focus-within:border-[#9f4f1d] focus-within:ring-4 focus-within:ring-[#9f4f1d]/10"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-black/10 bg-[#fcf6eb] px-3 py-2">
        {toolbarActions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => applyAction(action)}
            disabled={disabled}
            title={action.title}
            className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-black/70 transition hover:border-black/20 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-black/45">
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
        className="w-full resize-y bg-transparent px-4 py-3 text-sm leading-7 outline-none"
      />
    </div>
  );
}
