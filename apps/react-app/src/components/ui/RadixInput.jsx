import React from 'react'
import { cn } from '../../lib/utils'
import { cva } from 'class-variance-authority'

const inputVariants = cva(
  "flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-9 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-7 bg-gray-1 focus:border-blue-9 hover:border-gray-8",
        glass: "border-white/20 bg-white/5 backdrop-blur-md focus:border-blue-9 focus:bg-white/10 hover:bg-white/10",
        outline: "border-gray-7 bg-transparent focus:border-blue-9 hover:border-gray-8",
        filled: "border-transparent bg-gray-3 focus:border-blue-9 focus:bg-gray-1 hover:bg-gray-4"
      },
      size: {
        default: "h-10",
        sm: "h-8 text-xs",
        lg: "h-12 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

const Input = React.forwardRef(({ className, variant, size, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(inputVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

const InputGroup = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("relative", className)} {...props}>
    {children}
  </div>
))
InputGroup.displayName = "InputGroup"

const InputLeftElement = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-9", className)}
    {...props}
  >
    {children}
  </div>
))
InputLeftElement.displayName = "InputLeftElement"

const InputRightElement = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-9", className)}
    {...props}
  >
    {children}
  </div>
))
InputRightElement.displayName = "InputRightElement"

export { Input, InputGroup, InputLeftElement, InputRightElement, inputVariants }
export default inputVariants
