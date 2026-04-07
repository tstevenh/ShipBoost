import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-black first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-7 text-2xl font-semibold tracking-tight text-black first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-6 text-xl font-semibold tracking-tight text-black first:mt-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mt-4 text-base leading-8 text-black/74 first:mt-0">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-8 text-black/74">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-8 text-black/74">
            {children}
          </ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="mt-5 rounded-r-2xl border-l-4 border-[#9f4f1d]/30 bg-[#fff7ea] px-5 py-4 text-base leading-8 text-black/72">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#9f4f1d] underline decoration-[#9f4f1d]/30 underline-offset-4"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[0.95em] text-black">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mt-5 overflow-x-auto rounded-[1.5rem] bg-[#1d1c1a] p-5 text-sm leading-7 text-[#f6e8d4]">
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
