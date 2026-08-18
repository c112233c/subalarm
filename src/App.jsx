import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import OverviewPage from './pages/OverviewPage';
import AlarmDetailPage from './pages/AlarmDetailPage';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <OverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alarm/:sub"
        element={
          <ProtectedRoute>
            <AlarmDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}