import { Navigate, Route, Routes } from 'react-router-dom'
import HomeRoute from './components/Home'
import Dashboard from './components/Dashboard'
import StudentsPage from './components/Students/StudentsPage'
import TermsPage from './components/Academic/TermsPage'
import Placeholder from './components/Placeholder'
import Login from './pages/Login'

/**
 * EduSense routes: `/login` is the public home; the rest are protected by
 * session and use the shell with the lateral sidebar.
 *
 * @author Fanny Mayorga
 * @date   20-09-2026
 */
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<HomeRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/surveys" element={<Placeholder id="surveys" />} />
        <Route path="/schedule" element={<Placeholder id="schedule" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App