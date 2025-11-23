import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import NotFound from './components/NotFound';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import Profile from './pages/Profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, Protected } from './helpers/AuthContext';
import Matches from './pages/Matches';
import { useState } from 'react';
import Message from './pages/Message';
import { NotificationProvider } from './helpers/NotificationContext';
import Settings from './pages/Settings';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailRequired from './pages/VerifyEmailRequired';
import PasswordReset from './pages/PasswordReset';

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
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <Navbar />
            <main>
              <Routes>
                <Route path='/' element={<Protected><Home iProfile={iProfile} setIProfile={setIProfile}/></Protected>} />
                <Route path='/profile' element={<Protected profileOptional><Profile /></Protected>} />
                <Route path='/matches' element={<Protected><Matches /></Protected>} />
                <Route path='/login' element={<AuthForm key='login' action='login' />} />
                <Route path='/register' element={<AuthForm key='register' action='register' />} />
                <Route path='/verify-email/:token' element={<Protected authenticationOptional><VerifyEmail /></Protected>} />
                <Route path='/verify-email-required' element={<Protected emailVerificationOptional><VerifyEmailRequired /></Protected>} />
                <Route path='/reset-password/:token' element={<PasswordReset />} />
                <Route path='/message/:recipientId' element={<Protected><Message /></Protected>} />
                <Route path='/settings' element={<Protected emailVerificationOptional><Settings /></Protected>} />
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

export default App
