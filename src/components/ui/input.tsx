import * as React from "react"

import { cn } from "@/lib/utils"
import { inputFocusRing, inputFocusBorder } from '@/lib/dashboardTheme'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Input primitive: styling and focus behavior centralized here for consistency.
    // Avoid adding network or business logic inside primitives.
    return (
      <input
        type={type}
        className={cn(
          `flex h-9 w-full rounded-md border shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none ${inputFocusRing} ${inputFocusBorder} disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-card border-border text-foreground`,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
