import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import GamePage from './pages/GamePage.jsx';
import CancelPage from './pages/CancelPage.jsx';
import Login from './pages/organizer/Login.jsx';
import OrganizerLayout from './pages/organizer/OrganizerLayout.jsx';
import Dashboard from './pages/organizer/Dashboard.jsx';
import GameForm from './pages/organizer/GameForm.jsx';
import GameDetail from './pages/organizer/GameDetail.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games/:id" element={<GamePage />} />
      <Route path="/cancel/:token" element={<CancelPage />} />

      <Route path="/organizer/login" element={<Login />} />
      <Route path="/organizer" element={<OrganizerLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="games/new" element={<GameForm />} />
        <Route path="games/:id" element={<GameDetail />} />
        <Route path="games/:id/edit" element={<GameForm />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
