/**
 * Accessible Button Component
 * WCAG 2.1 AA Compliant
 */

import React from 'react'
import { Button } from './button'

export const AccessibleButton = React.forwardRef(
  (
    {
      children,
      ariaLabel,
      ariaDescribedBy,
      ariaPressed,
      ariaExpanded,
      ariaHaspopup,
      ariaControls,
      disabled,
      loading,
      icon,
      ...props
    },
    ref
  ) => {
    // If button has only an icon and no text, aria-label is required
    const hasTextContent =
      typeof children === 'string' ||
      (React.isValidElement(children) &&
        typeof children.props.children === 'string')

    const isIconOnly = icon && !children

    return (
      <Button
        ref={ref}
        aria-label={isIconOnly || !hasTextContent ? ariaLabel : undefined}
        aria-describedby={ariaDescribedBy}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        aria-controls={ariaControls}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className=" mr-2" aria-hidden="true">
              ⏳
            </span>
            <span className="sr-only"></span>
            {children}
          </>
        ) : (
          <>
            {icon && (
              <span aria-hidden="true" className="mr-2">
                {icon}
              </span>
            )}
            {children}
          </>
        )}
      </Button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'




export default AccessibleButton
