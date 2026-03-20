import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import AuthPage from './pages/AuthPage';
import DiscoverPage from './pages/DiscoverPage';
import MatchesPage from './pages/MatchesPage';
import MyListingsPage from './pages/MyListingsPage';
import NewListingPage from './pages/NewListingPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ProfilePage from './pages/ProfilePage';
import PremiumPage from './pages/PremiumPage';
import VerificationPage from './pages/VerificationPage';
import FavoritesPage from './pages/FavoritesPage';
import AdminPage from './pages/AdminPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
  const { isAuthenticated, user, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar />}
      <main className={isAuthenticated ? 'pb-20 lg:pb-0 lg:pl-64' : ''}>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
          } />
          <Route path="/forgot-password" element={
            isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />
          } />
          <Route path="/reset-password" element={
            isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordPage />
          } />
          <Route path="/" element={
            <ProtectedRoute><DiscoverPage /></ProtectedRoute>
          } />
          <Route path="/matches" element={
            <ProtectedRoute><MatchesPage /></ProtectedRoute>
          } />
          <Route path="/my-listings" element={
            <ProtectedRoute><MyListingsPage /></ProtectedRoute>
          } />
          <Route path="/listings/new" element={
            <ProtectedRoute><NewListingPage /></ProtectedRoute>
          } />
          <Route path="/listings/:id" element={
            <ListingDetailPage />
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/premium" element={
            <ProtectedRoute><PremiumPage /></ProtectedRoute>
          } />
          <Route path="/verification" element={
            <ProtectedRoute><VerificationPage /></ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute><FavoritesPage /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              {user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />}
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
