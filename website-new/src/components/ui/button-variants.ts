import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
          'focus-visible:ring-primary',
        ],
        primary: [
          'bg-vld-primary text-white',
          'hover:bg-vld-secondary',
          'focus-visible:ring-vld-primary',
          'shadow-sm hover:shadow-md',
        ],
        gradient: [
          'bg-gradient-to-r from-vld-primary to-cyan-500 text-white',
          'hover:from-cyan-500 hover:to-vld-primary',
          'focus-visible:ring-vld-primary',
          'shadow-lg hover:shadow-vld-primary/25 hover:scale-[1.02]',
        ],
        outline: [
          'border-2 border-border bg-transparent',
          'hover:bg-muted hover:border-muted-foreground/30',
          'focus-visible:ring-ring',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
          'focus-visible:ring-secondary',
        ],
        ghost: [
          'hover:bg-muted hover:text-foreground',
          'focus-visible:ring-ring',
        ],
        link: [
          'text-vld-primary underline-offset-4 hover:underline',
          'focus-visible:ring-vld-primary',
        ],
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90',
          'focus-visible:ring-destructive',
        ],
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md [&_svg]:w-3.5 [&_svg]:h-3.5',
        sm: 'h-8 px-3 text-sm rounded-md [&_svg]:w-4 [&_svg]:h-4',
        default: 'h-10 px-4 text-sm rounded-lg [&_svg]:w-4 [&_svg]:h-4',
        lg: 'h-11 px-6 text-base rounded-lg [&_svg]:w-5 [&_svg]:h-5',
        xl: 'h-12 px-8 text-base rounded-xl [&_svg]:w-5 [&_svg]:h-5',
        icon: 'h-10 w-10 rounded-lg [&_svg]:w-5 [&_svg]:h-5',
        'icon-sm': 'h-8 w-8 rounded-md [&_svg]:w-4 [&_svg]:h-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
