import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import NotFound from './components/NotFound';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import Profile from './pages/Profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './helpers/AuthContext';
import Loading from './components/Loading';
import Matches from './pages/Matches';
import { useState } from 'react';
import Message from './pages/Message';
import { NotificationProvider } from './helpers/NotificationContext';
import Settings from './pages/Settings';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailRequired from './pages/VerifyEmailRequired';
import PasswordReset from './pages/PasswordReset';
import TOS from './pages/TOS.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  }
});
window.__TANSTACK_QUERY_CLIENT__ = queryClient;

function App() {
  const [iProfile, setIProfile] = useState(0);
  const [page, setPage] = useState({ name: 'home', params: {} });
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <Navbar navigate={(name, params) => setPage({ name, params })} />
            <main>
              <Routes>
                <Route
                  path='/'
                  element={
                    <MainContent
                      page={page}
                      navigate={(name, params) => setPage({ name, params })}
                      iProfile={iProfile}
                      setIProfile={setIProfile}
                    />
                  }
                />
                <Route path='/login' element={<AuthForm key='login' action='login' />} />
                <Route path='/register' element={<AuthForm key='register' action='register' />} />
                <Route path='/verify-email/:token' element={<VerifyEmail />} />
                <Route path='/reset-password/:token' element={<PasswordReset />} />
                <Route path='*' element={<NotFound />} />
              </Routes>
            </main>
          </NotificationProvider>
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

const MainContent = ({ page, navigate, iProfile, setIProfile }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (page.name === "settings") return <Settings navigate={navigate} />;
  if (!user?.isEmailVerified) return <VerifyEmailRequired />;
  if (!user?.acceptedTos) return <TOS />;
  if (!user?.hasProfile) return <Profile />;

  switch (page.name) {
    case "home":
      return <Home iProfile={iProfile} setIProfile={setIProfile} navigate={navigate} />;
    case "profile":
      return <Profile navigate={navigate} />;
    case "matches":
      return <Matches navigate={navigate} />;
    case "message":
      return <Message recipientId={page.params.recipientId} navigate={navigate} />;
  }
};

export default App;
