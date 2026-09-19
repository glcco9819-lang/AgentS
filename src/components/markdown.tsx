"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MarkdownProps {
  content: string;
  className?: string;
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);
  const isDark = resolvedTheme === "dark";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border" dir="ltr">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-1.5">
        <span className="font-mono text-[11px] text-muted-foreground">
          {language || "text"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          onClick={copy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "کپی شد" : "کپی"}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "0.875rem 1rem",
          fontSize: "0.8125rem",
          lineHeight: 1.6,
        }}
        codeTagProps={{ style: { fontFamily: "var(--font-geist-mono), monospace" } }}
        wrapLongLines={false}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose-sm max-w-none text-[0.875rem] leading-7",
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-5",
        "[&_li]:my-0.5 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2",
        "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5",
        "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1",
        "[&_a]:text-primary [&_a]:underline [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-3 [&_blockquote]:text-muted-foreground",
        "[&_strong]:font-semibold [&_hr]:my-3 [&_hr]:border-border",
        "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse",
        "[&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_th]:text-xs",
        "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:text-xs",
        className
      )}
    >
      <ReactMarkdown
        components={{
          code({ className: c, children, ...props }) {
            const match = /language-(\w+)/.exec(c || "");
            const isInline = !c && !String(children).includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8em] text-foreground"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock
                language={match ? match[1] : ""}
                value={String(children).replace(/\n$/, "")}
              />
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
