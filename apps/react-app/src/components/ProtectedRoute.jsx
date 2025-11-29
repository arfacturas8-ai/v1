import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PageLoader from './PageLoader'
import PropTypes from 'prop-types'

/**
 * ProtectedRoute - Protects routes with authentication and optional role-based access control
 * @param {ReactNode} children - Child components to render if authorized
 * @param {string[]} requiredRoles - Array of roles that can access this route (optional)
 * @param {string[]} requiredPermissions - Array of permissions required (optional)
 * @param {string} redirectTo - Custom redirect path (defaults to /login for auth, /403 for authorization)
 */
export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  redirectTo
}) {
  const location = useLocation()
  const { isAuthenticated, loading, user } = useAuth()

  // Show loader while checking authentication
  if (loading) {
    return <PageLoader fullScreen />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo || "/login"} state={{ from: location }} replace />
  }

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0) {
    const userRole = user?.role || 'user'
    const hasRequiredRole = requiredRoles.includes(userRole) || userRole === 'admin' || userRole === 'superadmin'

    if (!hasRequiredRole) {
      return <Navigate to={redirectTo || "/403"} state={{ from: location, reason: 'insufficient_role' }} replace />
    }
  }

  // Check permission-based access if permissions are specified
  if (requiredPermissions.length > 0) {
    const userPermissions = user?.permissions || []
    const hasAllPermissions = requiredPermissions.every(perm =>
      userPermissions.includes(perm) || user?.role === 'admin' || user?.role === 'superadmin'
    )

    if (!hasAllPermissions) {
      return <Navigate to={redirectTo || "/403"} state={{ from: location, reason: 'insufficient_permissions' }} replace />
    }
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  requiredPermissions: PropTypes.arrayOf(PropTypes.string),
  redirectTo: PropTypes.string
}

/**
 * AdminRoute - Shorthand for routes that require admin access
 */
export function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
      {children}
    </ProtectedRoute>
  )
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired
}

/**
 * ModeratorRoute - Shorthand for routes that require moderator or higher access
 */
export function ModeratorRoute({ children }) {
  return (
    <ProtectedRoute requiredRoles={['moderator', 'admin', 'superadmin']}>
      {children}
    </ProtectedRoute>
  )
}

ModeratorRoute.propTypes = {
  children: PropTypes.node.isRequired
}

export default ProtectedRoute
