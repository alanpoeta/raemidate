import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import NotFound from './components/helpers/NotFound';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import Profile from './components/Profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, Protected } from './components/helpers/AuthContext';
import Match from './components/Match';
import DM from './components/DM';

const queryClient = new QueryClient({});
window.__TANSTACK_QUERY_CLIENT__ = queryClient;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Navbar />
          <main>
            <Routes>
              <Route path='/' element={<Protected><Home /></Protected>} />
              <Route path='/profile' element={<Protected profileOptional><Profile /></Protected>} />
              <Route path='/match' element={<Protected><Match /></Protected>} />
              <Route path='/login' element={<AuthForm key='login' action='login' />} />
              <Route path='/register' element={<AuthForm key='register' action='register' />} />
              <Route path='/dm/:recipientId' element={<Protected><DM /></Protected>} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </main>
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App
