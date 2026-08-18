import { useAuth } from '../auth/AuthProvider';

export default function ProtectedRoute({ children }) {
  const { initialized, authenticated, error, login } = useAuth();

  if (!initialized) {
    return <p className="notice">Loading...</p>;
  }

  if (error) {
    return (
      <div className="page">
        <p className="notice error">{error}</p>
      </div>
    );
  }

  if (!authenticated) {
    login();
    return <p className="notice">Redirecting to login...</p>;
  }

  return children;
}