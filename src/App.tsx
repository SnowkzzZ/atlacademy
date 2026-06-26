import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import VideoLesson from './pages/VideoLesson';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Intelligence from './pages/Intelligence';
import MateriaisApoio from './pages/MateriaisApoio';
import TreinamentosAoVivo from './pages/TreinamentosAoVivo';
import TreinamentoDetalhe from './pages/TreinamentoDetalhe';
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/lesson" element={<VideoLesson />} />
            <Route path="/lesson/:id" element={<VideoLesson />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/painel" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/intel" element={<Intelligence />} />
            <Route path="/materiais" element={<MateriaisApoio />} />
            <Route path="/treinamentos" element={<TreinamentosAoVivo />} />
            <Route path="/treinamentos/:id" element={<TreinamentoDetalhe />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
