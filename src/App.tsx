import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VideoLesson from './pages/VideoLesson';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Intelligence from './pages/Intelligence';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/lesson" element={<ProtectedRoute><VideoLesson /></ProtectedRoute>} />
            <Route path="/lesson/:id" element={<ProtectedRoute><VideoLesson /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/painel" element={<Admin />} />
            <Route path="/intel" element={<ProtectedRoute><Intelligence /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
