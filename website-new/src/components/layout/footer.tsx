import { Link } from 'react-router-dom'
import { Heart, Github, Zap, ExternalLink } from 'lucide-react'

interface FooterLink { name: string; href: string; external?: boolean }

const footerLinks: Record<string, FooterLink[]> = {
  Documentation: [
    { name: 'Getting Started', href: '/docs' },
    { name: 'API Reference', href: '/api' },
    { name: 'Examples', href: '/examples' },
    { name: 'Playground', href: '/playground' },
  ],
  Resources: [
    { name: 'Benchmarks', href: '/benchmark' },
    { name: 'Changelog', href: 'https://github.com/ersinkoc/vld/releases', external: true },
    { name: 'Contributing', href: 'https://github.com/ersinkoc/vld/blob/main/CONTRIBUTING.md', external: true },
    { name: 'License', href: 'https://github.com/ersinkoc/vld/blob/main/LICENSE', external: true },
  ],
  Community: [
    { name: 'GitHub', href: 'https://github.com/ersinkoc/vld', external: true },
    { name: 'Issues', href: 'https://github.com/ersinkoc/vld/issues', external: true },
    { name: 'Discussions', href: 'https://github.com/ersinkoc/vld/discussions', external: true },
    { name: 'npm', href: 'https://www.npmjs.com/package/@oxog/vld', external: true },
  ],
}

export function Footer() {
  return (
    <footer className="relative border-t border-border">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/30 pointer-events-none" />

      <div className="relative container-wide py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-4 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vld-primary to-cyan-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="font-display font-bold text-xl block">VLD</span>
                <span className="text-xs text-muted-foreground">Validation Library</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
              Ultra-fast, type-safe validation for TypeScript.
              2.5x faster than Zod with zero dependencies.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/ersinkoc/vld"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://www.npmjs.com/package/@oxog/vld"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3 rounded-lg bg-muted flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors text-sm font-mono"
                aria-label="npm"
              >
                npm
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-display font-semibold text-sm mb-4 text-foreground">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-vld-primary transition-colors inline-flex items-center gap-1"
                      >
                        {link.name}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-vld-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} VLD. Released under MIT License.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            Crafted with
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            by
            <a
              href="https://github.com/ersinkoc"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-vld-primary transition-colors"
            >
              Ersin KOC
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
