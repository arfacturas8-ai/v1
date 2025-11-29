import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PageLoader from './PageLoader'

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()

  // Show loader while checking authentication
  if (loading) {
    return <PageLoader fullScreen />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}



export default ProtectedRoute
