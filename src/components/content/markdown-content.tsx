import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
        h2: ({ children }) => (
          <h2 className="mt-7 text-2xl font-black tracking-tight text-foreground first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-6 text-xl font-black tracking-tight text-foreground first:mt-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground first:mt-0">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-muted-foreground">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-muted-foreground">
            {children}
          </ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="mt-5 rounded-r-2xl border-l-4 border-border bg-muted/20 px-5 py-4 text-base italic leading-relaxed text-muted-foreground">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground transition-all"
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
            className="mt-6 w-full rounded-[1.75rem] border border-border bg-card object-cover shadow-sm"
          />
        ),
        code: ({ children }) => (
          <code className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] font-bold text-foreground">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-foreground p-5 text-sm leading-relaxed text-background">
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
