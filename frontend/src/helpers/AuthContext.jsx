import { useContext } from "react";
import { createContext, useEffect, useState } from "react";
import { auth } from "./api";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate  } from 'react-router-dom'
import Loading from '../components/Loading'
import queriesOptions from "./queries";
import VerifyEmailRequired from "../pages/VerifyEmailRequired";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    auth()
    .then(isAuthenticated => {
      if (isAuthenticated) login();
      else setIsLoading(false);
    });
  }, []);

  const prefetchQueries = async () => {
    queryClient.invalidateQueries({ queryKey: queriesOptions.user.queryKey })
    const userData = await queryClient.fetchQuery(queriesOptions.user);
    
    const newUser = {
      username: userData.username,
      email: userData.email,
      hasProfile: userData.has_profile,
      isEmailVerified: userData.is_email_verified
    };

    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));

    if (!newUser.hasProfile || !newUser.isEmailVerified) return;

    [queriesOptions.swipe, queriesOptions.match, queriesOptions.profile].forEach(queryOptions => {
      queryClient.invalidateQueries({ queryKey: queryOptions.queryKey })
      queryClient.prefetchQuery(queryOptions);
    });
  }

  const login = async (accessToken=null, refreshToken=null) => {
    if (accessToken) localStorage.setItem('access', accessToken);
    if (refreshToken) localStorage.setItem('refresh', refreshToken);

    await prefetchQueries();

    setIsAuthenticated(true);
    setIsLoading(false);
  }

  const logout = async () => {
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

export const Protected = ({ profileOptional = false, emailVerificationOptional = false, authenticationOptional = false, children }) => {
  if (authenticationOptional) emailVerificationOptional = true;
  if (emailVerificationOptional) profileOptional = true;

  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated && !authenticationOptional) return <Navigate to='/login' />;

  if (user?.isEmailVerified === false && !emailVerificationOptional)
    return <VerifyEmailRequired />;

  if (user?.hasProfile === false && !profileOptional)
    return <Navigate to='/profile' />;

  return children;
}
