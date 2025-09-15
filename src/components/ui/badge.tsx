import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { inputFocusRing } from '@/lib/dashboardTheme'

const badgeVariants = cva(
  `inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 ${inputFocusRing} focus:ring-offset-2`,
  {
    variants: {
      variant: {
        default:
          "border-transparent shadow",
        secondary:
          "border-transparent",
        destructive:
          "border-transparent shadow",
        outline: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  const variantClass = (() => {
    switch (variant) {
      case 'secondary':
        return 'bg-muted text-muted-foreground border-transparent'
      case 'destructive':
        return 'bg-destructive text-destructive-foreground border-transparent'
      case 'outline':
        return 'bg-card text-foreground border-border'
      case 'default':
      default:
        return 'bg-primary text-primary-foreground border-transparent'
    }
  })()

  return (
    <div
      className={cn(badgeVariants({ variant }), variantClass, className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
