import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type MarkdownHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function childrenToText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(childrenToText).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    return childrenToText((children as { props?: { children?: ReactNode } }).props?.children);
  }

  return "";
}

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
  const lines = content.split(/\r?\n/);
  const headings: MarkdownHeading[] = [];
  const seen = new Map<string, number>();

  for (const line of lines) {
    const match = /^(##|###)\s+(.+?)\s*$/.exec(line.trim());

    if (!match) {
      continue;
    }

    const text = match[2].replace(/[#`*_~]+/g, "").trim();

    if (!text) {
      continue;
    }

    const level = match[1] === "##" ? 2 : 3;
    const baseId = slugifyHeading(text);
    const seenCount = seen.get(baseId) ?? 0;
    seen.set(baseId, seenCount + 1);

    headings.push({
      id: seenCount === 0 ? baseId : `${baseId}-${seenCount + 1}`,
      text,
      level,
    });
  }

  return headings;
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mt-8 text-3xl font-black tracking-tight text-foreground first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => {
          const id = slugifyHeading(childrenToText(children));

          return (
            <h2
              id={id}
              className="mt-10 scroll-mt-28 text-[1.8rem] font-black tracking-tight text-foreground first:mt-0"
            >
              {children}
            </h2>
          );
        },
        h3: ({ children }) => {
          const id = slugifyHeading(childrenToText(children));

          return (
            <h3
              id={id}
              className="mt-8 scroll-mt-28 text-[1.25rem] font-black tracking-tight text-foreground first:mt-0"
            >
              {children}
            </h3>
          );
        },
        p: ({ children }) => (
          <p className="mt-5 text-[1.02rem] leading-8 text-muted-foreground first:mt-0">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mt-5 list-disc space-y-3 pl-6 text-[1.02rem] leading-8 text-muted-foreground">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-5 list-decimal space-y-3 pl-6 text-[1.02rem] leading-8 text-muted-foreground">
            {children}
          </ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="mt-7 rounded-r-2xl border-l-4 border-border bg-muted/30 px-5 py-4 text-[1.02rem] italic leading-8 text-foreground/75">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target={href?.startsWith("#") ? undefined : "_blank"}
            rel={href?.startsWith("#") ? undefined : "noreferrer"}
            className="font-bold text-foreground underline decoration-border underline-offset-4 transition-all hover:decoration-foreground"
          >
            {children}
          </a>
        ),
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src ?? ""}
            alt={alt ?? ""}
            loading="lazy"
            className="mt-8 w-full rounded-[1.75rem] border border-border bg-card object-cover shadow-sm"
          />
        ),
        code: ({ children }) => (
          <code className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] font-bold text-foreground">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mt-7 overflow-x-auto rounded-2xl bg-foreground p-5 text-sm leading-relaxed text-background">
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
