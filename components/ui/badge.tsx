import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center liquid-border border px-3 py-1.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden backdrop-blur-sm',
  {
    variants: {
      variant: {
        default:
          'bg-primary/90 text-primary-foreground border-primary/20 [a&]:hover:bg-primary',
        secondary:
          'bg-secondary/80 text-secondary-foreground border-secondary/20 [a&]:hover:bg-secondary',
        destructive:
          'bg-destructive/90 text-white border-destructive/20 [a&]:hover:bg-destructive focus-visible:ring-destructive/20',
        outline:
          'text-foreground border-border bg-background/50 [a&]:hover:bg-accent/50 [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
