import { useState } from 'react';
import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Home from './components/Home';
import NotFound from './components/NotFound';
import Protected from './components/Protected';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import Profile from './components/Profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({});
window.__TANSTACK_QUERY_CLIENT__ = queryClient;

function App() {
  const [navUsername, setNavUsername] = useState(() => localStorage.getItem('username'));

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navbar navUsername={navUsername} />
          <main>
            <Routes>
              <Route path='/' element={<Protected><Home /></Protected>} />
              <Route path='/login' element={<AuthForm key='login' action='login' setNavUsername={setNavUsername}/>} />
              <Route path='/register' element={<AuthForm key='register' action='register' setNavUsername={setNavUsername}/>} />
              <Route path='/profile' element={<Profile />} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </main>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App
