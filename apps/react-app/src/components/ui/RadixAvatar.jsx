import React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '../../lib/utils'
import { cva } from 'class-variance-authority'

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full border-2 transition-all duration-200",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20"
      },
      variant: {
        default: "border-gray-6",
        primary: "border-blue-9 ring-2 ring-blue-9/20",
        glass: "border-white/20 backdrop-blur-sm",
        gradient: "border-transparent bg-gradient-to-br from-blue-9 to-violet-9 p-0.5"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default"
    }
  }
)

const Avatar = React.forwardRef(({ className, size, variant, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size, variant }), className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-9 to-violet-9 text-white font-semibold text-sm",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
export default avatarVariants
