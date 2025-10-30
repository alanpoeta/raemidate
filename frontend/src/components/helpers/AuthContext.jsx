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
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    auth()
    .then(isAuthenticated => {
      if (isAuthenticated) login(null, null, user, false);
      else setIsLoading(false);
    });
  }, []);

  const prefetchQueries = async () => {
    const profile = await queryClient.fetchQuery(queriesOptions.profile)
    const hasProfile = profile.first_name !== "";
    setUser(user => {
      const newUser = {
        ...user,
        hasProfile
      }
      localStorage.setItem('user', JSON.stringify(newUser));

      return newUser
    });
    if (!hasProfile) return;

    Object.values(queriesOptions).forEach(queryOption => {
      if (queryOption.queryKey[0] !== 'profile') {
        queryClient.prefetchQuery(queryOption);
      }
    });
  }

  const login = async (accessToken=null, refreshToken=null, user=null, toHome=true) => {
    if (accessToken) localStorage.setItem('access', accessToken);
    if (refreshToken) localStorage.setItem('refresh', refreshToken);
    if (user) setUser(prev => {
      const newUser = {
        ...prev,
        ...user
      }
      localStorage.setItem('user', JSON.stringify(newUser));

      return newUser
    });

    await prefetchQueries();

    setIsAuthenticated(true);
    setIsLoading(false);
    if (toHome) navigate('/');
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
    setCleanupFn,
    prefetchQueries
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
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to='/login' />;
  if (user.hasProfile === false && !profileOptional) {
    return <Navigate to='/profile' />;
  }
  return children;
}
