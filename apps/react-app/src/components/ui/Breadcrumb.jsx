import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

/**
 * Modern Breadcrumb Navigation Component
 * Provides hierarchical navigation with auto-generation from routes
 */
function Breadcrumb({ 
  items, 
  separator = <ChevronRight style={{
  width: '16px',
  height: '16px'
}} />, 
  showHome = true,
  className = '',
  maxItems = 4,
  ...props 
}) {
  const location = useLocation()
  
  // Auto-generate breadcrumbs from current route if no items provided
  const breadcrumbItems = items || generateBreadcrumbsFromRoute(location.pathname)
  
  // Truncate if too many items
  const displayItems = breadcrumbItems.length > maxItems 
    ? [
        breadcrumbItems[0],
        { label: '...', href: null, disabled: true },
        ...breadcrumbItems.slice(-2)
      ]
    : breadcrumbItems

  return (
    <nav 
      className={`breadcrumb ${className}`}
      aria-label="Breadcrumb navigation"
      {...props}
    >
      <ol className="breadcrumb-list">
        {showHome && breadcrumbItems[0]?.href !== '/' && (
          <li className="breadcrumb-item">
            <Link 
              to="/" 
              className="breadcrumb-link breadcrumb-home"
              aria-label="Home"
            >
              <Home style={{
  width: '16px',
  height: '16px'
}} />
            </Link>
            <span className="breadcrumb-separator" aria-hidden="true">
              {separator}
            </span>
          </li>
        )}
        
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1
          const isDisabled = item.disabled
          
          return (
            <li key={index} className="breadcrumb-item">
              {isDisabled ? (
                <span className="breadcrumb-ellipsis">
                  {item.label}
                </span>
              ) : isLast ? (
                <span 
                  className="breadcrumb-current" 
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link 
                  to={item.href} 
                  className="breadcrumb-link"
                >
                  {item.label}
                </Link>
              )}
              
              {!isLast && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Auto-generate breadcrumbs from route path
function generateBreadcrumbsFromRoute(pathname) {
  const segments = pathname.split('/').filter(Boolean)
  
  const breadcrumbs = [
    { label: 'Home', href: '/' }
  ]
  
  let currentPath = ''
  
  segments.forEach(segment => {
    currentPath += `/${segment}`
    
    // Convert segment to readable label
    const label = segment
      .replace(/-/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
      .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    
    breadcrumbs.push({
      label,
      href: currentPath
    })
  })
  
  return breadcrumbs
}




export default Breadcrumb
