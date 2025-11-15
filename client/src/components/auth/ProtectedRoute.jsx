import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';

const ProtectedRoute = ({ children, requireAuth = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading message="Loading..." />;
  }

  // If route requires auth and user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;