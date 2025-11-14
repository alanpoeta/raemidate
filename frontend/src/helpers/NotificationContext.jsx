import { useContext, createContext } from "react";
import useWebSocket from "./useWebSocket";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { socketRef, isOpen } = useWebSocket("notification/", { enabled: isAuthenticated && user?.hasProfile });

  const notificationValue = {
    socketRef, isOpen
  };

  return (
    <NotificationContext.Provider value={notificationValue}>
      { children }
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within NotificationProvider.");
  return context;
}
