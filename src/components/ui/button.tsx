import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-accent text-ink hover:bg-accent/90",
        quiet: "border border-line bg-raised text-fg hover:border-accent",
        ghost: "bg-transparent text-fg hover:bg-raised",
        danger: "bg-transparent text-warn hover:bg-warn-bg",
      },
      size: {
        md: "min-h-11 px-3 text-sm",
        sm: "min-h-11 px-2.5 text-sm",
      },
    },
    defaultVariants: { variant: "quiet", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
