"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--r-md)] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color,opacity] outline-none select-none active:scale-[0.96] focus-visible:shadow-[var(--ring-focus)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Existing shadcn variants (unchanged)
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        // Game variants
        primary:
          "bg-[linear-gradient(180deg,var(--color-primary-1),var(--color-primary-2))] text-white shadow-[var(--shadow-press)] w-full border-[3px] border-transparent font-display uppercase tracking-widest",
        glass:
          "bg-[var(--glass-1)] border-[3px] border-[var(--glass-border)] backdrop-blur-[var(--blur-md)] text-[var(--color-text)] w-full font-display uppercase tracking-widest",
        safe:
          "bg-[linear-gradient(180deg,var(--color-safe-light),var(--color-safe))] text-[var(--color-safe-text)] w-full border-[3px] border-transparent font-display uppercase tracking-widest",
        danger:
          "bg-[linear-gradient(180deg,var(--color-imp-light),var(--color-imp))] text-white w-full border-[3px] border-transparent font-display uppercase tracking-widest",
      },
      size: {
        // Existing shadcn sizes (unchanged)
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        // Game sizes (min-h-[44px] for touch targets lives here, not on the base)
        "game-lg": "h-[60px] sm:h-16 px-8 text-xl sm:text-2xl gap-3 min-h-[44px]",
        "game-md": "h-12 sm:h-[52px] px-6 text-lg gap-2 min-h-[44px]",
        "game-sm": "h-9 px-4 text-base gap-1.5 min-h-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
