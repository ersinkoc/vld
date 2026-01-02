import { useState } from 'react'
import { Highlight, themes, type Language } from 'prism-react-renderer'
import { cn } from '@/lib/utils'
import { Check, Copy, Terminal } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

interface CodeBlockProps {
  code: string
  language?: Language
  filename?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  className?: string
}

export function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { resolvedTheme } = useTheme()

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const theme = resolvedTheme === 'dark' ? themes.nightOwl : themes.nightOwlLight

  return (
    <div className={cn('code-block group relative', className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between bg-muted/50 dark:bg-zinc-800/80 px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          {filename && (
            <span className="text-sm font-mono text-muted-foreground">
              {filename}
            </span>
          )}
          {!filename && (
            <span className="text-xs font-mono text-muted-foreground uppercase">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted rounded-md"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-vld-success" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Code content */}
      <Highlight theme={theme} code={code.trim()} language={language}>
        {({ className: preClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(preClassName, 'overflow-x-auto p-4 text-sm')}
            style={{ ...style, background: 'transparent' }}
          >
            <code className="font-mono">
              {tokens.map((line, i) => {
                const lineNumber = i + 1
                const isHighlighted = highlightLines.includes(lineNumber)
                return (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className={cn(
                      'table-row',
                      isHighlighted && 'bg-vld-primary/10 -mx-4 px-4 border-l-2 border-vld-primary'
                    )}
                  >
                    {showLineNumbers && (
                      <span className="table-cell pr-4 text-right select-none text-muted-foreground/50 w-8">
                        {lineNumber}
                      </span>
                    )}
                    <span className="table-cell">
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                )
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  )
}
