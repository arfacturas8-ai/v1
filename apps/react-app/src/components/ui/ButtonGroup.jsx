import React from 'react'

const ButtonGroup = ({
  children,
  variant = 'horizontal',
  size = 'md',
  className = '',
  attached = true,
  ...props
}) => {
  const baseClasses = 'flex'
  
  const variantClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
    wrap: 'flex-row flex-wrap'
  }

  const spacingClasses = {
    xs: attached ? '' : 'gap-xs',
    sm: attached ? '' : 'gap-sm',
    md: attached ? '' : 'gap-md',
    lg: attached ? '' : 'gap-lg',
    xl: attached ? '' : 'gap-xl'
  }

  const attachedStyles = attached ? {
    // Remove rounded corners and borders between buttons
    '& > *:not(:first-child):not(:last-child)': {
      borderRadius: '0',
      marginLeft: variant === 'horizontal' ? '-1px' : '0',
      marginTop: variant === 'vertical' ? '-1px' : '0'
    },
    '& > *:first-child': {
      borderTopRightRadius: variant === 'horizontal' ? '0' : undefined,
      borderBottomRightRadius: variant === 'horizontal' ? '0' : undefined,
      borderBottomLeftRadius: variant === 'vertical' ? '0' : undefined
    },
    '& > *:last-child': {
      borderTopLeftRadius: variant === 'horizontal' ? '0' : undefined,
      borderBottomLeftRadius: variant === 'horizontal' ? '0' : undefined,
      borderTopRightRadius: variant === 'vertical' ? '0' : undefined,
      marginLeft: variant === 'horizontal' ? '-1px' : '0',
      marginTop: variant === 'vertical' ? '-1px' : '0'
    }
  } : {}

  const groupClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${spacingClasses[size]}
    ${className}
  `

  return (
    <div 
      className={groupClasses}
      style={attachedStyles}
      role="group"
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child

        // Clone child with additional props for attached styling
        if (attached) {
          const childClasses = child.props.className || ''
          let attachedClasses = ''

          if (React.Children.count(children) > 1) {
            if (index === 0) {
              // First child
              attachedClasses = variant === 'horizontal' 
                ? 'rounded-r-none border-r-0' 
                : 'rounded-b-none border-b-0'
            } else if (index === React.Children.count(children) - 1) {
              // Last child  
              attachedClasses = variant === 'horizontal'
                ? 'rounded-l-none'
                : 'rounded-t-none'
            } else {
              // Middle children
              attachedClasses = variant === 'horizontal'
                ? 'rounded-none border-r-0'
                : 'rounded-none border-b-0'
            }
          }

          return React.cloneElement(child, {
            className: `${childClasses} ${attachedClasses}`.trim(),
            style: {
              zIndex: child.props.focus ? 1 : 0,
              ...child.props.style
            }
          })
        }

        return child
      })}
    </div>
  )
}




export default ButtonGroup
