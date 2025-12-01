import { useContext } from "react";
import { createContext, useEffect, useState } from "react";
import { auth } from "./api";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from 'react-router-dom';
import queriesOptions from "./queries";
import Loading from "../components/Loading";
import Settings from "../pages/Settings";
import VerifyEmailRequired from "../pages/VerifyEmailRequired";
import TOS from "../pages/TOS";
import Profile from "../pages/Profile";
import Home from "../pages/Home";
import Matches from "../pages/Matches";
import Message from "../pages/Message";

const AuthContext = createContext();

export const AuthProvider = ({ children, resetPage }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({});

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
      isEmailVerified: userData.is_email_verified,
      acceptedTos: userData.accepted_tos
    };

    setUser(newUser);

    if (!newUser.hasProfile || !newUser.isEmailVerified || !newUser.acceptedTos) return;

    [queriesOptions.swipe, queriesOptions.matches, queriesOptions.profile].forEach(queryOptions => {
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
    resetPage();
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
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
};

export const MainContent = ({ page, navigate, iProfile, setIProfile }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (page.name === "settings") return <Settings navigate={navigate} />;
  if (!user?.isEmailVerified) return <VerifyEmailRequired />;
  if (!user?.acceptedTos) return <TOS />;
  if (!user?.hasProfile) return <Profile />;

  switch (page.name) {
    case "home":
      return <Home iProfile={iProfile} setIProfile={setIProfile} navigate={navigate} />;
    case "profile":
      return <Profile navigate={navigate} />;
    case "matches":
      return <Matches navigate={navigate} />;
    case "message":
      return <Message recipientId={page.params.recipientId} navigate={navigate} />;
  }
};
