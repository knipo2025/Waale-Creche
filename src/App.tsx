import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import DashboardPage from './pages/DashboardPage'
import EnfantDetailPage from './pages/EnfantDetailPage'
import EnfantFormPage from './pages/EnfantFormPage'
import EnfantsPage from './pages/EnfantsPage'
import LoginPage from './pages/LoginPage'
import PaiementFormPage from './pages/PaiementFormPage'
import PaiementsPage from './pages/PaiementsPage'
import ParametresPage from './pages/ParametresPage'
import PresencesPage from './pages/PresencesPage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/enfants"
            element={
              <ProtectedRoute>
                <EnfantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enfants/nouveau"
            element={
              <ProtectedRoute>
                <EnfantFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enfants/:id"
            element={
              <ProtectedRoute>
                <EnfantDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enfants/:id/modifier"
            element={
              <ProtectedRoute>
                <EnfantFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paiements"
            element={
              <ProtectedRoute>
                <PaiementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paiements/nouveau"
            element={
              <ProtectedRoute>
                <PaiementFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/presences"
            element={
              <ProtectedRoute>
                <PresencesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parametres"
            element={
              <ProtectedRoute>
                <ParametresPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tableau-de-bord"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/tableau-de-bord" replace />} />
          <Route path="*" element={<Navigate to="/tableau-de-bord" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
