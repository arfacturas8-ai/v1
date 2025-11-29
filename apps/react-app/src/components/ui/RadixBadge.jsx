import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-9 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-9 text-white shadow-lg shadow-blue-9/25 hover:shadow-xl",
        secondary: "border-transparent bg-gray-3 text-gray-11 hover:bg-gray-4",
        destructive: "border-transparent bg-red-500 text-white shadow-lg shadow-red-500/25",
        outline: "border-gray-7 text-gray-11 hover:bg-gray-2",
        success: "border-transparent bg-green-500 text-white shadow-lg shadow-green-500/25",
        warning: "border-transparent bg-yellow-500 text-white shadow-lg shadow-yellow-500/25",
        glass: "border-white/20 bg-white/10 backdrop-blur-md text-gray-12 hover:bg-white/20",
        gradient: "border-transparent bg-gradient-to-r from-blue-9 to-violet-9 text-white shadow-lg shadow-blue-9/25"
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

function Badge({ className, variant, size, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
export default badgeVariants
