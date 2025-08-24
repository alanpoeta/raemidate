import { useContext } from "react";
import { createContext, useEffect, useState } from "react";
import { auth } from "../../api";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate  } from 'react-router-dom'
import Loading from './Loading'

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    auth()
    .then(isAuthenticated => setIsAuthenticated(isAuthenticated))
    .then(() => {
      const user = JSON.parse(localStorage.getItem("user"));
      setUser(user);
    })
    .then(() => setIsLoading(false));
  }, []);

  const login = (accessToken, refreshToken, user) => {
    localStorage.setItem('access', accessToken);
    localStorage.setItem('refresh', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setIsAuthenticated(true);
    setIsLoading(false);
  }

  const logout = () => {
    localStorage.clear();
    queryClient.clear();
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const authValue = {
    isAuthenticated,
    isLoading,
    user,
    login, 
    logout
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
