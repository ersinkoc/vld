import { Link } from 'react-router-dom'
import { Heart, Github, Zap } from 'lucide-react'

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
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vld-primary to-vld-secondary flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl gradient-text">VLD</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Ultra-fast, type-safe validation library for TypeScript. 
              Zero dependencies, full type inference.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <a
                href="https://github.com/ersinkoc/vld"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VLD. MIT License.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> by{' '}
            <a
              href="https://github.com/ersinkoc"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-vld-primary hover:underline"
            >
              Ersin KOÇ
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
