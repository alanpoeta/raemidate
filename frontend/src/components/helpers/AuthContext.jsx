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
  const [cleanupFn, setCleanupFn] = useState(null);
  const [user, setUserNaive] = useState(JSON.parse(localStorage.getItem("user")));
  const setUser = updatedUser => {
    if (typeof updatedUser === "function") {
      localStorage.setItem('user', JSON.stringify(updatedUser(user)));
    } else {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    setUserNaive(updatedUser);
  };

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    auth()
    .then(isAuthenticated => {
      setIsAuthenticated(isAuthenticated);
      setIsLoading(false);
    });
  }, []);

  const login = (accessToken, refreshToken, user) => {
    localStorage.setItem('access', accessToken);
    localStorage.setItem('refresh', refreshToken);
    setUser(user);
    setIsAuthenticated(true);
    navigate('/');
  }

  const logout = async () => {
    if (cleanupFn) await cleanupFn();
    setCleanupFn(null);
    localStorage.clear();
    queryClient.clear();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const authValue = {
    isAuthenticated,
    isLoading,
    user,
    setUser,
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

export const Protected = ({ profileOptional = false, children }) => {
  const { isAuthenticated, isLoading, setUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  if (!isAuthenticated) return <Navigate to='/login' />;

  useEffect(() => {
    Object.values(queriesOptions).forEach(queryOption => {
      if (queryOption.queryKey[0] !== 'profile') {
        queryClient.prefetchQuery(queryOption);
        return;
      }

      queryClient.fetchQuery(queriesOptions.profile)
      .then(() => {
        setUser(user => ({
          ...user,
          hasProfile: true
        }));
      }).catch(() => {
        setUser(user => ({
          ...user,
          hasProfile: false
        }));
        if (!profileOptional) navigate('/profile');
      });
    });
  }, []);

  if (isLoading) return <Loading />;
  return children;
}
