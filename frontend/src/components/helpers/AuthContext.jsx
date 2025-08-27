import { useContext } from "react";
import { createContext, useEffect, useState } from "react";
import { auth } from "../../api";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate  } from 'react-router-dom'
import Loading from './Loading'
import queriesOptions from "../../queries";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [cleanupFn, setCleanupFn] = useState(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    auth()
    .then(isAuthenticated => setIsAuthenticated(isAuthenticated))
    .then(() => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) setUser(user);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      Object.values(queriesOptions).forEach(queryOption => {
        queryClient.prefetchQuery(queryOption);
      });
    }
  }, [isAuthenticated]);

  const login = (accessToken, refreshToken, user) => {
    setIsLoading(true);
    localStorage.setItem('access', accessToken);
    localStorage.setItem('refresh', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setIsAuthenticated(true);
    navigate('/');
    setIsLoading(false);
  }

  const logout = async () => {
    setIsLoading(true);
    if (cleanupFn) await cleanupFn();
    setCleanupFn(null);
    localStorage.clear();
    queryClient.clear();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
    setIsLoading(false);
  };

  const authValue = {
    isAuthenticated,
    isLoading,
    user,
    login, 
    logout,
    setCleanupFn
  };

  return (
    <AuthContext.Provider value={authValue}>
      { children }
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}

export const Protected = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to='/login' />;
  return children;
}
