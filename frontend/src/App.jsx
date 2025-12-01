import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NotFound from './components/NotFound';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, MainContent } from './helpers/AuthContext';
import { useState } from 'react';
import { NotificationProvider } from './helpers/NotificationContext';
import VerifyEmail from './pages/VerifyEmail';
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
  const [page, setPage] = useState({ name: 'home', params: {} });
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider resetPage={() => setPage({ name: 'home', params: {} })}>
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

export default App;
