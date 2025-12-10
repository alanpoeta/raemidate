import { Route, Routes, useNavigate } from 'react-router-dom';
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
  
  let navigateNaive = useNavigate();
  const navigate = (name, params={}) => {
    navigateNaive("/");
    setPage({ name, params });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider resetPage={() => navigate("home")}>
        <NotificationProvider navigate={navigate}>
          <div className="min-h-screen bg-gray-100 flex justify-center items-start sm:items-center font-sans text-gray-800">
            <div className="w-full sm:max-w-md h-[100dvh] sm:h-[90vh] bg-white sm:rounded-2xl shadow-xl overflow-hidden flex flex-col relative">
              <Navbar navigate={navigate} />
              <main className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">
                <Routes>
                  <Route
                    path='/'
                    element={
                      <MainContent
                        page={page}
                        navigate={navigate}
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
            </div>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
