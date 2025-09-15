import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonPrimaryGradient } from '@/lib/dashboardTheme'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "shadow",
        primary: "shadow",
        destructive: "shadow-sm",
        outline: "border shadow-sm",
        secondary: "shadow-sm",
        ghost: "",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    // UI primitive: button applies design system variants. Keep logic-free to
    // allow easy snapshot/unit testing and consistent theming across the app.
    
    const variantClass = (() => {
      switch (variant) {
        case 'primary':
          return `bg-gradient-to-r ${buttonPrimaryGradient} text-primary-foreground border-transparent`
        case 'destructive':
          return 'bg-destructive text-destructive-foreground border-destructive'
        case 'outline':
          return 'bg-card text-foreground border-border'
        case 'secondary':
          return 'bg-muted text-muted-foreground border-transparent'
        case 'ghost':
          return 'bg-transparent text-foreground border-transparent'
        case 'link':
          return 'bg-transparent text-primary'
        case 'default':
        default:
          return 'bg-primary text-primary-foreground border-transparent'
      }
    })()

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), variantClass, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
