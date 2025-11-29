import React from 'react'
import { cn } from '../../lib/utils'

const Card = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const baseClasses = "rounded-xl border transition-all duration-200"
  
  const variants = {
    default: "bg-gray-1 border-gray-6 shadow-sm hover:shadow-md",
    glass: "bg-white/5 backdrop-blur-md border-white/10 shadow-lg hover:bg-white/10 hover:border-white/20",
    elevated: "bg-gray-1 border-gray-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
    outline: "bg-transparent border-gray-7 hover:bg-gray-2 hover:border-gray-8",
    gradient: "bg-gradient-to-br from-blue-1 to-violet-1 border-blue-6 shadow-lg hover:shadow-xl"
  }
  
  return (
    <div
      ref={ref}
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-gray-12", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-11", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
export default Card
