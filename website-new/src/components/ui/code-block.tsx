import { useState, useMemo } from 'react'
import { highlight } from '@oxog/codeshine'
import { cn } from '@/lib/utils'
import { Check, Copy, FileCode, Terminal } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  className?: string
  variant?: 'default' | 'terminal' | 'minimal'
}

// Extract just the inner content from codeshine's output (strip wrapper pre/code tags)
function extractCodeContent(html: string): string {
  // Find the cs-line-content span and extract everything inside it
  const lineContentMatch = html.match(/<span class="cs-line-content">([\s\S]*?)<\/span><\/span><\/code><\/pre>/)
  if (lineContentMatch) {
    return lineContentMatch[1]
  }

  // Alternative: try to find content between cs-line-content tags more broadly
  const altMatch = html.match(/<span class="cs-line-content">([\s\S]+)<\/span>/)
  if (altMatch) {
    // Remove trailing </span></code></pre> if present
    let content = altMatch[1]
    content = content.replace(/<\/span><\/code><\/pre>[\s\S]*$/, '')
    return content
  }

  // Fallback: return the original html but strip outer wrapper
  return html
    .replace(/<pre[^>]*>/, '')
    .replace(/<\/pre>$/, '')
    .replace(/<code[^>]*>/, '')
    .replace(/<\/code>$/, '')
    .replace(/<span class="cs-line">/, '')
    .replace(/<span class="cs-line-content">/, '')
}

export function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className,
  variant = 'default',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { resolvedTheme } = useTheme()

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const themeName = resolvedTheme === 'dark' ? 'tokyoNight' : 'oneDark'

  const lines = useMemo(() => {
    return code.trim().split('\n')
  }, [code])

  const highlightedLines = useMemo(() => {
    return lines.map(line => {
      try {
        const result = highlight(line || ' ', { language, theme: themeName })
        // Extract just the token spans without the wrapper
        return extractCodeContent(result)
      } catch {
        return escapeHtml(line)
      }
    })
  }, [lines, language, themeName])

  const isTerminal = variant === 'terminal' || language === 'bash' || language === 'shell'

  return (
    <div className={cn('group relative', className)}>
      {/* Terminal window frame */}
      <div className="terminal-window">
        {/* Header with traffic lights */}
        <div className="terminal-header">
          <div className="flex items-center gap-1.5">
            <span className="terminal-dot terminal-dot-red" />
            <span className="terminal-dot terminal-dot-yellow" />
            <span className="terminal-dot terminal-dot-green" />
          </div>

          <div className="flex-1 flex items-center justify-center">
            {filename ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <FileCode className="w-3.5 h-3.5" />
                <span>{filename}</span>
              </div>
            ) : isTerminal ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <Terminal className="w-3.5 h-3.5" />
                <span>Terminal</span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                {language}
              </span>
            )}
          </div>

          <button
            onClick={copyToClipboard}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              'opacity-0 group-hover:opacity-100',
              'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
            )}
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code content */}
        <div className="terminal-body hide-scrollbar">
          <pre className="text-sm leading-[1.7] font-mono">
            <code>
              {highlightedLines.map((lineHtml, i) => {
                const lineNumber = i + 1
                const isHighlighted = highlightLines.includes(lineNumber)

                return (
                  <div
                    key={i}
                    className={cn(
                      'flex',
                      isHighlighted && 'bg-vld-primary/10 -mx-4 px-4 border-l-2 border-vld-primary'
                    )}
                  >
                    {showLineNumbers && (
                      <span className="line-number shrink-0 w-8 text-right pr-4 select-none">
                        {lineNumber}
                      </span>
                    )}
                    <span
                      className="flex-1 whitespace-pre code-line"
                      dangerouslySetInnerHTML={{ __html: lineHtml }}
                    />
                  </div>
                )
              })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Inline code component
export function InlineCode({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <code className={cn(
      'px-1.5 py-0.5 rounded-md text-sm font-mono',
      'bg-slate-100 dark:bg-slate-800 text-vld-primary',
      className
    )}>
      {children}
    </code>
  )
}

// Command line component for installation commands
export function CommandLine({ command, className }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn(
      'group flex items-center gap-3 px-4 py-3 rounded-lg',
      'bg-slate-900 border border-slate-700',
      'font-mono text-sm',
      className
    )}>
      <span className="text-emerald-400 select-none">$</span>
      <code className="flex-1 text-slate-100">{command}</code>
      <button
        onClick={copyToClipboard}
        className={cn(
          'p-1.5 rounded-md transition-all',
          'opacity-0 group-hover:opacity-100',
          'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
        )}
        aria-label="Copy command"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
