import React from 'react'
import * as Primitive from '@radix-ui/react-primitive'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-9 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:shadow-lg transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-blue-9 text-white shadow-lg shadow-blue-9/25 hover:bg-blue-10 hover:shadow-xl hover:shadow-blue-9/30",
        destructive: "bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/30",
        outline: "border border-gray-7 bg-transparent text-gray-12 shadow-sm hover:bg-gray-2 hover:border-gray-8",
        secondary: "bg-gray-3 text-gray-12 shadow-sm hover:bg-gray-4 hover:shadow-md",
        ghost: "text-gray-11 hover:bg-gray-3 hover:text-gray-12",
        link: "text-blue-9 underline-offset-4 hover:underline",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-gray-12 hover:bg-white/20 hover:border-white/30 shadow-lg",
        gradient: "bg-gradient-to-r from-blue-9 to-violet-9 text-white shadow-lg shadow-blue-9/25 hover:shadow-xl hover:shadow-blue-9/30 hover:from-blue-10 hover:to-violet-10"
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

const Button = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  asChild = false, 
  loading = false,
  children,
  disabled,
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : "button"
  
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </Comp>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
export default buttonVariants
